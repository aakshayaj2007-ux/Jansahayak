// Karnataka districts (31). Compare with the official government list before launch,
// because district names and boundaries can change.
export const KARNATAKA_DISTRICTS: string[] = [
  'Bagalkot',
  'Ballari',
  'Belagavi',
  'Bengaluru Rural',
  'Bengaluru Urban',
  'Bidar',
  'Chamarajanagar',
  'Chikkaballapur',
  'Chikkamagaluru',
  'Chitradurga',
  'Dakshina Kannada',
  'Davanagere',
  'Dharwad',
  'Gadag',
  'Hassan',
  'Haveri',
  'Kalaburagi',
  'Kodagu',
  'Kolar',
  'Koppal',
  'Mandya',
  'Mysuru',
  'Raichur',
  'Ramanagara',
  'Shivamogga',
  'Tumakuru',
  'Udupi',
  'Uttara Kannada',
  'Vijayanagara',
  'Vijayapura',
  'Yadgir',
]

// Taluk SUGGESTIONS only. Users can still type any taluk.
// Add more districts here from the official list, in the same format.
export const TALUK_SUGGESTIONS: Record<string, string[]> = {
  Mandya: [
    'Mandya',
    'Maddur',
    'Malavalli',
    'Nagamangala',
    'Pandavapura',
    'Srirangapatna',
    'Krishnarajpet',
  ],
}