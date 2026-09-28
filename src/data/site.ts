// Every agent fact lives here as a visible placeholder.
// Fill these in (and update README "Placeholders to fill") before any real launch.

export const site = {
  agency: 'Vietmeier Insurance',
  agentName: '[Agent Name]',
  town: 'McKees Rocks',
  state: 'PA',
  address: '[Address], McKees Rocks, PA [ZIP]',
  phoneDisplay: '[Phone] 412-555-0142',
  // Fake local number from the 555-01XX range reserved for fiction.
  phoneTel: '+14125550142',
  phoneShort: '412-555-0142',
  email: '[email]@vietmeierinsurance.example',
  license: '[License #]',
  npn: '[NPN]',
  hours: '[Weekday hours], evenings by appointment',
  carriers: 'Carriers: [to be listed]',
  bookHref: '/contact#book',
} as const;

export const nav = [
  { href: '/medicare', label: 'Medicare' },
  { href: '/medigap', label: 'Medigap' },
  { href: '/life', label: 'Life' },
  { href: '/annuities', label: 'Annuities' },
  { href: '/more-coverage', label: 'More Coverage' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const productLines = [
  'Medicare Advantage',
  'Medicare Part D (drug plans)',
  'Medigap (Medicare Supplement)',
  'Life insurance',
  'Annuities',
  'Hospital indemnity',
  'Something else',
] as const;
