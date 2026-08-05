import csv
import re

file_path = r'c:\Users\awais\OneDrive\Documents\GitHub\mail_test_production\email_data.csv'

with open(file_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows = list(reader)

cleaned_rows = []

noise_prefixes = [
    r'^KElectric\s*', r'^Mobilink[A-Za-z0-9_\-\s]*?\s+', r'^Netsoft[A-Za-z0-9_\-\s]*?\s+', r'^NRTC\s+(Brig\(R\)|Commodore)?\s*', r'^Saif\s+Group\s+', r'^Samsunng[A-Za-z0-9_\-\s]*?\s+', r'^Style\s+Textile\s+', r'^Nishat[A-Za-z0-9_\-\s]*?\s+',
    r'^ABL[A-Za-z0-9_\-\s]*?\s+', r'^LTC[A-Za-z0-9_\-\s]*?\s+', r'^Sapphire[A-Za-z0-9_\-\s]*?\s+', r'^Sindh\s+Revenue\s+Board\s+', r'^KPK\s+DC\s+', r'^DG\s+Cement\s+', r'^DG\s+', r'^Zic[A-Za-z0-9_\-\s]*?\s+', r'^ZiC[A-Za-z0-9_\-\s]*?\s+', r'^ZIC[A-Za-z0-9_\-\s]*?\s+',
    r'^PITB\s+', r'^Expo\s+', r'^Sngpl[A-Za-z0-9_\-\s]*?\s+', r'^SNGPL[A-Za-z0-9_\-\s]*?\s+', r'^Irrigation\s+', r'^SECP[A-Za-z0-9_\-\s]*?\s+', r'^BoP-?\s*', r'^BOP-?\s*',
    r'^MCB[A-Za-z0-9_\-\s]*?\s+', r'^Safe\s+City\s+', r'^Home\s+Dept[A-Za-z0-9_\-\s]*?\s+', r'^Bank\s+Alfalah\s+', r'^HMB\s+',
    r'^PP[A-Za-z0-9_\-\s]*?\s+', r'^RFID\s+', r'^Railway[A-Za-z0-9_\-\s]*?\s+', r'^Railways[A-Za-z0-9_\-\s]*?\s+', r'^RRailways\s+', r'^Honda[A-Za-z0-9_\-\s]*?\s+',
    r'^TRG\s+', r'^Teresol\s+(Dr)?\s*', r'^Diamod\s+IT\s+', r'^NetSol\s+', r'^Witribe\s+', r'^Lesco\s+', r'^Haleeb\s+', r'^KBL\s+', r'^PAF\s+(Sqn\s+leader|Wing\s+Commander)?\s*',
    r'^Punjab-Health[A-Za-z0-9_\-\s]*?\s+', r'^Kedacom\s+', r'^Arkam\s+', r'^NLC\s+', r'^ETPB\s+(Col)?\s*', r'^EPI\s+', r'^Treet\s+', r'^PVTC\s+', r'^UET\s+', r'^channel24\s*', r'^Channel24\s*',
    r'^Softech\s+', r'^Mezan[A-Za-z0-9_\-\s]*?\s+', r'^IEC[A-Za-z0-9_\-\s]*?\s+', r'^Ufone[A-Za-z0-9_\-\s]*?\s+', r'^Huawei\s+', r'^Qarshi\s+', r'^System[A-Za-z0-9_\-\s]*?\s+',
    r'^Schiendar\s+', r'^Schneider\s+', r'^shaheen\s+galileo\s*', r'^Pak\s+Kuwait\s+', r'^SOHAIL-SHAFIQ', r'^State\s+Bank\s+', r'^Teradata\s+', r'^PEPSI-?\s*', r'^PTCL\s+', r'^Multilynx\s+',
    r'^Ibrahim[A-Za-z0-9_\-\s]*?\s+', r'^Ibraheem[A-Za-z0-9_\-\s]*?\s+', r'^Evacuee\s+Trust\s+', r'^Fire-Safe\s+', r'^FatimahGroup\s+', r'^emerson\s+',
    r'^Ericsson[A-Za-z0-9_\-\s]*?\s+', r'^ERICSSON[A-Za-z0-9_\-\s]*?\s+', r'^Express\s+', r'^IGI\s+', r'^Autosoft\s+', r'^Borjan-?\s*',
    r'^Chenab[A-Za-z0-9_\-\s]*?\s+', r'^Coca\s+', r'^Descon\s+', r'^Adamjee\s+', r'^IMMI[A-Za-z0-9_\-\s]*?\s+', r'^Maheen[A-Za-z0-9_\-\s]*?\s+', r'^Condoprotego\s+', r'^Zong[A-Za-z0-9_\-\s]*?\s+'
]

def clean_name(raw_name, email):
    name = raw_name.strip()
    
    # Strip paths like /IT/LHR
    name = re.sub(r'/[A-Z]+/[A-Z]+', '', name).strip()
    
    # Apply noise regexes repeatedly
    for _ in range(2):
        for pattern in noise_prefixes:
            name = re.sub(pattern, '', name, flags=re.IGNORECASE).strip()
            
    # Remove titles
    name = re.sub(r'^(Brig\(R\)|Commodore|Sqn\s+leader|Wing\s+Commander|Col|DIG|COO|CIO|DD/I|AIG|CISO|DR|Dr|Manager|Proc|Procur|Pro)\s+', '', name, flags=re.IGNORECASE).strip()
    
    # Remove leading non-alphabet characters like - or _
    name = re.sub(r'^[_\-\s]+', '', name).strip()
    
    # Replace internal hyphens with spaces for names like Shahzad-Zaman or Adnan-Ansari
    if '-' in name and not '@' in name:
        name = name.replace('-', ' ')
        
    # Title Case formatting
    name = name.title()
    
    # Fallback if empty
    if not name or len(name) < 2:
        email_prefix = email.split('@')[0].split('.')[0]
        name = email_prefix.title()
        
    return name

for r in rows:
    old_name = r[0]
    email = r[1]
    new_name = clean_name(old_name, email)
    cleaned_rows.append([new_name, email])

# Save to both email_data.csv and extracted_firms.csv
for dest in [file_path, r'c:\Users\awais\OneDrive\Documents\GitHub\mail_test_production\extracted_firms.csv']:
    with open(dest, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Name', 'Email'])
        writer.writerows(cleaned_rows)

print(f"Cleaned {len(cleaned_rows)} rows successfully!")
