import Link from 'next/link';
import React from 'react';
import { Separator } from './ui/separator';
import { VisuallyHidden } from './ui/visually-hidden';
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-900 px-4 py-2 text-center text-base text-white">
      <div className="mx-auto flex max-w-[1920px] flex-col items-center justify-between gap-4 px-8 py-4 pb-6 pt-8 md:px-16">
        

        <Separator className="mt-4 w-full" />
        <div className="flex w-full flex-col items-center justify-between sm:flex-row">
          <p className="flex items-center justify-center gap-1 text-sm md:text-base">
           Geeth © {year}
          </p>
          <p className="text-xs sm:text-sm md:text-base">
            Built by{' '}
            <span className="font-bold">
              <Link href="https://geethgunna.com" className="underline">
                Geeth<VisuallyHidden>Geeth Gunnampalli</VisuallyHidden>
              </Link>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
