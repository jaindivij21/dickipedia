import { normConstituency, normState } from './text.ts';

const RESERVED_SC: Record<string, string[]> = {
  'Andhra Pradesh': ['Amalapuram', 'Bapatla', 'Chittoor', 'Thirupathi'],
  Assam: ['Silchar'],
  Bihar: ['Gaya', 'Gopalganj', 'Hajipur', 'Jamui', 'Samastipur', 'Sasaram'],
  Chhattisgarh: ['JANJGIR-CHAMPA'],
  Gujarat: ['Ahmedabad West', 'Kachchh'],
  Haryana: ['AMBALA', 'SIRSA'],
  'Himachal Pradesh': ['SHIMLA'],
  Jharkhand: ['Palamau'],
  Karnataka: ['Bijapur', 'Chamarajanagar', 'Chitradurga', 'Gulbarga', 'Kolar'],
  Kerala: ['Alathur', 'Mavelikkara'],
  'Madhya Pradesh': ['BHIND', 'DEWAS', 'TIKAMGARH', 'UJJAIN'],
  Maharashtra: ['Amravati', 'Latur', 'Ramtek', 'Shirdi', 'Solapur'],
  'NCT OF Delhi': ['North-West Delhi'],
  Odisha: ['Bhadrak', 'Jagatsinghpur', 'Jajpur'],
  Punjab: ['Faridkot', 'Fatehgarh Sahib', 'Hoshiarpur', 'Jalandhar'],
  Rajasthan: ['BHARATPUR', 'BIKANER', 'GANGANAGAR', 'KARAULI-DHOLPUR'],
  'Tamil Nadu': [
    'CHIDAMBARAM',
    'KANCHEEPURAM',
    'NAGAPATTINAM',
    'NILGIRIS',
    'TENKASI',
    'TIRUVALLUR',
    'VILUPPURAM',
  ],
  Telangana: ['Nagarkurnool', 'Peddapalle', 'Warangal'],
  'Uttar Pradesh': [
    'Agra',
    'Baharaich',
    'Bansgaon',
    'Barabanki',
    'Bulandshahr',
    'Etawah',
    'Hardoi',
    'Hathras',
    'Jalaun',
    'Kaushambi',
    'Lalganj',
    'Machhlishahr',
    'Misrikh',
    'Mohanlalganj',
    'Nagina',
    'Robertsganj',
    'Shahjahanpur',
  ],
  Uttarakhand: ['Almora'],
  'West Bengal': [
    'Arambagh',
    'Bangaon',
    'Bardhaman Purba',
    'Bishnupur',
    'Bolpur',
    'Coochbehar',
    'Jalpaiguri',
    'Joynagar',
    'Mathurapur',
    'Ranaghat',
  ],
};

const RESERVED_ST: Record<string, string[]> = {
  'Andhra Pradesh': ['Araku'],
  Assam: ['Diphu', 'Kokrajhar'],
  Chhattisgarh: ['BASTAR', 'KANKER', 'RAIGARH', 'SURGUJA'],
  'Dadra & Nagar Haveli and Daman & Diu': ['Dadar & Nagar Haveli'],
  Gujarat: ['Bardoli', 'Chhota Udaipur', 'Dahod', 'Valsad'],
  Jharkhand: ['Dumka', 'Khunti', 'Lohardaga', 'Rajmahal', 'Singhbhum'],
  Karnataka: ['Bellary', 'Raichur'],
  Lakshadweep: ['Lakshadweep'],
  'Madhya Pradesh': ['BETUL', 'DHAR', 'KHARGONE', 'MANDLA', 'RATLAM', 'SHAHDOL'],
  Maharashtra: ['Dindori', 'Gadchiroli - Chimur', 'Nandurbar', 'Palghar'],
  Manipur: ['Outer Manipur'],
  Meghalaya: ['Shillong', 'Tura'],
  Mizoram: ['MIZORAM'],
  Odisha: ['Keonjhar', 'Koraput', 'Mayurbhanj', 'Nabarangpur', 'Sundargarh'],
  Rajasthan: ['BANSWARA', 'DAUSA', 'UDAIPUR'],
  Telangana: ['Adilabad', 'Mahabubabad'],
  Tripura: ['Tripura East'],
  'West Bengal': ['Alipurduars', 'Jhargram'],
};

const buildIndex = (m: Record<string, string[]>): Map<string, Set<string>> => {
  const index = new Map<string, Set<string>>();
  for (const [state, names] of Object.entries(m)) {
    index.set(normState(state), new Set(names.map((n) => normConstituency(n))));
  }
  return index;
};

const SC_INDEX = buildIndex(RESERVED_SC);
const ST_INDEX = buildIndex(RESERVED_ST);

export function reservationFor(state: string, pcName: string): 'SC' | 'ST' | 'GEN' {
  const s = normState(state);
  const c = normConstituency(pcName);
  if (SC_INDEX.get(s)?.has(c)) return 'SC';
  if (ST_INDEX.get(s)?.has(c)) return 'ST';
  return 'GEN';
}
