/**
 * Parses a Sanity schema definition and generates appropriate GROQ queries
 * @param {string} schemaCode - The Sanity schema definition code
 * @returns {Object} An object containing the parsed schema structure
 */
export function parseSanitySchema(schemaCode: string) {
  try {
    // Extract the type name from the schema
    const typeNameMatch = schemaCode.match(/name:\s*['"]([^'"]+)['"]/)
    const typeName = typeNameMatch ? typeNameMatch[1] : "unknown"

    // Define types for our schema fields
    type SubField = {
      name: string;
      type: string;
      validation?: boolean;
    }
    
    type NestedField = {
      name: string;
      type: string;
      subFields?: SubField[];
      validation?: boolean;
    }
    
    type SchemaField = {
      name: string;
      type: string;
      of?: string | { type: string; fields?: SubField[] }[];
      nestedFields?: NestedField[];
      validation?: boolean;
      title?: string;
    }

    // First pass: Extract basic field definitions
    const fieldsRegex = /defineField\(\{[\s\S]+?name:\s*['"]([^'"]+)['"][\s\S]+?type:\s*['"]([^'"]+)['"][\s\S]+?\}\)/g
    const fields: SchemaField[] = []
    let match

    while ((match = fieldsRegex.exec(schemaCode)) !== null) {
      const fieldDef = match[0];
      const fieldName = match[1];
      const fieldType = match[2];
      
      const titleMatch = fieldDef.match(/title:\s*['"]([^'"]+)['"]/);
      const hasValidation = fieldDef.includes('validation:');
      
      fields.push({
        name: fieldName,
        type: fieldType,
        title: titleMatch ? titleMatch[1] : undefined,
        validation: hasValidation
      })
    }

    // Process array fields with complex object types
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      
      if (field.type === 'array') {
        // Extract the array definition section
        const arrayDefRegex = new RegExp(`defineField\\({[\\s\\S]+?name:\\s*['"]${field.name}['"][\\s\\S]+?of:\\s*\\[(.*?)\\][\\s\\S]+?\\}\\)`, 's');
        const arrayDefMatch = schemaCode.match(arrayDefRegex);
        
        if (arrayDefMatch) {
          const arrayContent = arrayDefMatch[0];
          const arrayOfSection = arrayDefMatch[1];
          
          // Check if it contains objects
          if (arrayOfSection.includes('type: \'object\'') || arrayOfSection.includes('type: "object"')) {
            // Extract fields section from the object definition
            const objFieldsRegex = /fields:\s*\[([\s\S]+?)\]/;
            const objFieldsMatch = arrayContent.match(objFieldsRegex);
            
            if (objFieldsMatch) {
              const objFieldsContent = objFieldsMatch[1];
              const nestedFields: NestedField[] = [];
              
              // Process each field in the object
              // This regex matches each field definition including field options and nested content
              const nestedFieldRegex = /{\s*name:\s*['"]([^'"]+)['"],[\s\S]+?type:\s*['"]([^'"]+)['"][\s\S]*?(?:},|},\s*{|}\s*\])/g;
              let nestedFieldMatch;
              
              while ((nestedFieldMatch = nestedFieldRegex.exec(objFieldsContent)) !== null) {
                const nestedName = nestedFieldMatch[1];
                const nestedType = nestedFieldMatch[2];
                // Get the full field definition by finding the substring until the next match or end
                const endMarker = nestedFieldMatch[3];
                const nestedDef = nestedFieldMatch[0].substring(0, nestedFieldMatch[0].lastIndexOf(endMarker)) + "}";
                
                const nestedField: NestedField = {
                  name: nestedName,
                  type: nestedType,
                  validation: nestedDef.includes('validation:')
                };
                
                // Special handling for image fields
                if (nestedType === 'image') {
                  // Check for subfields like alt text
                  const subFieldsRegex = new RegExp(`fields:\\s*\\[(.*?)\\]`, 's');
                  const subFieldsMatch = nestedDef.match(subFieldsRegex);
                  
                  if (subFieldsMatch) {
                    const subFieldsContent = subFieldsMatch[1];
                    const subFields: SubField[] = [];
                    
                    // Process each subfield
                    const subFieldRegex = /{\s*name:\s*['"]([^'"]+)['"],[\s\S]+?type:\s*['"]([^'"]+)['"][\s\S]*?},?/g;
                    let subFieldMatch;
                    
                    while ((subFieldMatch = subFieldRegex.exec(subFieldsContent)) !== null) {
                      subFields.push({
                        name: subFieldMatch[1],
                        type: subFieldMatch[2],
                        validation: subFieldMatch[0].includes('validation:')
                      });
                    }
                    
                    if (subFields.length > 0) {
                      nestedField.subFields = subFields;
                    }
                  }
                }
                
                nestedFields.push(nestedField);
              }
              
              if (nestedFields.length > 0) {
                fields[i].of = 'object';
                fields[i].nestedFields = nestedFields;
              }
            }
          }
        }
      }
    }

    return {
      typeName,
      fields,
    }
  } catch (error) {
    console.error("Error parsing schema:", error)
    return {
      typeName: "unknown",
      fields: [],
    }
  }
}

/**
 * Generates GROQ queries based on the parsed schema
 * @param {Object} schema - The parsed Sanity schema
 * @returns {Object} An object containing different query types
 */
export function generateGroqQueries(schema: { 
  typeName: string; 
  fields: Array<{ 
    name: string; 
    type: string; 
    of?: string | Array<{ type: string; fields?: Array<{ name: string; type: string }> }>;
    nestedFields?: Array<{ 
      name: string; 
      type: string; 
      subFields?: Array<{ name: string; type: string }> 
    }>;
  }> 
}) {
  const { typeName, fields } = schema

  // Basic field projection
  const basicFields = fields
    .filter((field) => field.type !== "array")
    .map((field) => field.name)
    .join(",\n    ")

  // Process array fields
  const arrayFields = fields.filter((field) => field.type === "array")
  
  // Handle different types of array fields
  const processedArrayFields = arrayFields.map((field) => {
    // Object arrays with nested fields
    if (field.of === "object" && field.nestedFields && field.nestedFields.length > 0) {
      // Get unique field names to avoid duplicates
      const uniqueNestedFields = field.nestedFields.filter((value, index, self) =>
        index === self.findIndex((t) => t.name === value.name)
      );
      
      const nestedFieldsProjection = uniqueNestedFields.map(nestedField => {
        // Handle image fields with potential alt text
        if (nestedField.type === 'image') {
          // Handle main image field
          const imageField = `"${nestedField.name}": ${nestedField.name}.asset->url`;
          
          // Handle subfields (like alt text)
          if (nestedField.subFields && nestedField.subFields.length > 0) {
            const imageSubFields = nestedField.subFields.map(subField => {
              return `"${nestedField.name}${subField.name.charAt(0).toUpperCase() + subField.name.slice(1)}": ${nestedField.name}.${subField.name}`
            }).join(",\n        ");
            
            return `${imageField},\n        ${imageSubFields}`;
          }
          
          return imageField;
        }
        // Regular fields just return the name
        return nestedField.name;
      }).join(",\n        ");
      
      return `${field.name}[] {\n        ${nestedFieldsProjection}\n      }`;
    }
    // Default array handling
    else {
      return `${field.name}[]`;
    }
  }).join(",\n    ");

  // Generate single document query
  const singleDocumentQuery = `*[_type == "${typeName}"][0] {
    ${basicFields}${basicFields && processedArrayFields ? ",\n    " : ""}${processedArrayFields}
  }`;

  // Generate multiple documents query
  const multipleDocumentsQuery = `*[_type == "${typeName}"] {
    ${basicFields}${basicFields && processedArrayFields ? ",\n    " : ""}${processedArrayFields}
  }`;

  // Generate document by slug query (if slug field exists)
  let slugQuery = null;
  if (fields.some((field) => field.name === "slug")) {
    slugQuery = `*[_type == "${typeName}" && slug.current == $slug][0] {
      ${basicFields}${basicFields && processedArrayFields ? ",\n      " : ""}${processedArrayFields}
    }`;
  }

  return {
    singleDocumentQuery,
    multipleDocumentsQuery,
    slugQuery,
  };
}

/**
 * Wraps GROQ query in different code formats based on preference
 * @param {string} query - The GROQ query string
 * @param {string} format - The code format (ts, js, or groq)
 * @param {string} typeName - The name of the schema type
 * @returns {string} Formatted query code
 */
export function formatQueryCode(query: string, format: string, typeName: string, queryType: string = "") {
  const queryName = `get${typeName.charAt(0).toUpperCase() + typeName.slice(1)}${queryType}Query`;
  
  // Clean up the query by removing extra whitespace
  const cleanedQuery = query.trim();

  switch (format) {
    case "ts":
      return `import { defineQuery } from 'sanity';

export const ${queryName} = defineQuery(\`
${cleanedQuery}
\`);`;
    case "js":
      return `import { defineQuery } from 'sanity';

export const ${queryName} = defineQuery(\`
${cleanedQuery}
\`);`;
    case "groq":
    default:
      return cleanedQuery;
  }
}