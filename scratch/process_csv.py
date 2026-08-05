import re

raw_text = """
KElectric Muhammad Razzaq	muhammad.razzaq@ke.com.pk
Mobilink Fin IT Zeeshan Rafiq	zeeshan.rafiq@jazz.com.pk
Netsoft Mudassir	info@netsoft-solutions.net
NRTC Brig(R) Zahid Maitla	zahid.mehmood@nrtc.com.pk
Saif Group Rafiq Ahmed	rafiq@saifgroup.com
Samsunng Videowall Sajid Optimum	sajid@optimum.com.pk
Style Textile Mirza Abbas Ali	abbas@styletextile.com
Nishat Shafqat Niaz	shafqat.niaz@nishatmills.com
ABL Kamaran Siddiqui	kamran.siddiqui@abl.com
Nishat Asif Najib	asif.najib@nishatsutas.com
Nishat Mills IT Shuaib	muhammad.shuaib@nishatmills.com
LTC Hassan Naeem	hassan.naaem@ptc.gop.pk
LTC Salman Amin	salman.amin@ptc.gop.pk
Sapphire IT Ahmed Bilal	ahmed@sapphirefibres.com
LTC Yasir Shafi	yasir.shafi@ptc.gop.pk
LTC Qayyum	abdul.qayyum@ptc.gop.pk
Sindh Revenue Board Shahid Ghani	shahid.ghani@srb.gos.pk
KPK DC Zulfiqar	zulfiqar@kp.gov.pk
DG Cement Inayat Ullah Niazi	iniazi@dgcement.com
Zic Waseem Abbas	waseem@masgroup.org
PITB Syed Qasim Afzal	syed.qasim@pitb.gov.pk
Expo Suhail Anjum	suhail@pakexcel.com
Sngpl Procu Rizwan	rizwan.jamil@sngpl.com.pk
Irrigation Ijaz ul Hassan	Ijazkashif@msn.com
LTC Usman	usman.malik@ptc.gop.pk
ABL CISO Awais Ejaz	awais.ejaz@abl.com
SECP IT Usman	usman.ahmad@secp.gov.pk
BoP Ali Manzar	Ali.manzer@bop.com.pk
MCB MarkettingHead Humaid	humaid.merchant@mcb.com.pk
Safe City Zahid Farooq	zahid.farooq@psca.gop.pk
Safe City Ali Nawaz	ALI.NAWAZ@psca.gop.pk
Home Dept Agha MuawarHossein	munawarhusain5@gmail.com
Home Dept AIG Interrior Mudassar	ranamudassar.hd@gmail.com
Bank Alfalah Syed Shahab	syed.shahab@bankalfalah.com
HMB Rizwan	rizwan.idrees@habibmetro.com
Mathar	mathar.abdullah@nift.pk
PP DIG Balochistan Mustafa Hameed Malik	mustafa@ctd.gop.pk
PP Logistic Khurram	htsolutions43@gmail.com
ABL Hassan Rizvi	hassan.rizvi@abl.com
SNGPL Mohammad Riaz	Muhammad.riaz@sngpl.com.pk
RFID Usman	u.aziz@technobeez.com
Railway DD/I Tahir	tahir.riaz@pakrail.gov.pk
Honda Proc Nawazish Ali	nawazish@honda.com.pk
Mobilink Fin IT Zeeshan Rafiq	zeeshan.rafiq@jazz.com.pk
TRG Zagham Abbass	MuhammadZagham.Abbas2@ibex.co
TRG Atif	Muhammad.Atif@ibex.co
Railways Ali Nawab	alinawabkhan@gmail.com
Teresol Dr Naveed	niqbal@teresol.com
RRailways Umair	muhammad.umair@pakrail.gov.pk
Railways PM Ali Abbass	Ali.Abbas@pakrail.gov.pk
Railways Muhammad Umair	muhammad.umair@pakrail.gov.pk
Diamod IT Imtiaz	imtiaz.ahmad@diamondfoam.com
NetSol Naveed Amir	naveed.amir@netsoltech.com
NetSol Asif Zafar	asif.zafar@netsoltech.com
Sajid Zaidi	sajid.zaidi@haier.com.pk
KElectric Fawaz Ali	fawaz.ali@ke.com.pk
KElectric Tabinda Mumtaz	tabinda.mumtaz@ke.com.pk
KElectric Muhammad Razzaq	muhammad.razzaq@ke.com.pk
Hasnat Shah	hasnat@abacus.com
SNGPL Hafiz Yasir	mohammad.yasir@sngpl.com.pk
Mobilink Commerial Mariana Hashmi	mariana.hashmi@jazz.com.pk
Mobilink IS Majid Iqbal	majid.iqbal@jazz.com.pk
Mobilink IS Lakht-e-Hasnain Bashir	lakht.hassnain@jazz.com.pk
Railways Saeed Gondal	saeed.gondal2016@gmail.com
Witribe Amjad Pervaiz	Amjad.Pervaiz@pk.wi-tribe.com
Lesco Tanveer	managernw@lesco.gov.pk
Haleeb Abdul Waheed	abdul.waheed@haleebfoods.com
MCB Basit Tansir	basit.tansir@mcb.com.pk
MCB Wajahat	wajahat.arshad@mcb.com.pk
ABL Jawad Khalid	Jawad.Khalid@abl.com
KBL Naveed	Naveed.Khan@kb.com.pk
KBL Haroon Khan	Haroon.Khan@kb.com.pk
KBL Rizwan	rizwan.hafeez@kb.com.pk
Honda Qadir	abdulqadir@honda.com.pk
Ericsson Yasir Gulzar	yasir.gulzar@ericsson.com
KBL Atif Ahmed	atif.aziz@kb.com.pk
Diamond Mustafa Luqman	md@mpil.com.pk
ABL Kashif Manzoor	Kashif.Manzoor@abl.com
PAF Sqn leader Mohsin	mspaf@paf.gov.pk
NRTC Commodore Raheel Massod	raheel.masood@nrtc.con.pk
Mobilink Proc Mohsin	mohsin.rehman@jazz.com.pk
ZiC CHead Nasir Ahmed	nasir.ahmed@masgroup.org
Punjab-Health NetworkManager Sohail	Sohail.sadiq@punjab.gov.pk
Kedacom Nayab	pakistan@kedacom.com
Arkam Ameer Zamir	amirzamirahmed@gmail.com
NLC Asim Ali	cio@nlc.com.pk
NLC Osman Abid	osman.abid@nlc.com.pk
NLC Shahid Ahmed	Shahid.Ahmed@nlc.com.pk
PITB Saflain	saflain@pitb.gov.pk
ETPB Col Ghafoor Arshad	chiefengr@etpb.gov.pk
EPI Jawaid Siddiqui	Pakistan@epi-ap.com
Treet Jahangir	muhammad.jahanger@treetonline.com
PVTC Rana Hammad Hassan	rana.hammad@pvtc.gop.pk
PVTC Ghazanfar Abbas	ghazanfar.abbas@pvtc.gop.pk
UET MudasserKhan	mudasser.khan@uet.edu.pk
MCB Tahir Aziz	aziz.tahir@mcb.com.pk
Zic Hassan Tahir	hassan@masgroup.org
Netsoft Naveed-Sabir	naveed@netsoft-solutions.net
Netsoft Solution Athar Sabir	info@netsoft-solutions.net
Ericsson	shah.hussain@ericsson.com
channel24 Abid Choudhery	abid.choudhery@24newshd.tv
Channel24 Dibaj Haider	dibaj.haider@24newshd.tv
Softech Salman	salman@softech.com.pk
MCB Commercial Aqeel Anwar	aqeel.anwar@mcb.com.pk
Mezan Pur Iftikhar Sharif	purchase@mezangrp.com
MCB Security Sohail	syed.sohail@mcb.com.pk
HMB Shakeel Butt	shakeel.butt@habibmetro.com
Mezan Rashid Hussain	rashid@mezanbeverages.com
MCB Islamic Usman Rasool	rasool.usman@mcbislamicbank.com
Style Textile Adnan Mughal	adnan.mughal@styletextile.com
IEC-Bilal	bilal.hanif@iec.com.pk
IEC Khalid Malik	Khalid.malik@iec.com.pk
Style Textile Nauman Majeed	nauman.majeed@styletextile.com
Honda Proc Nawazish Ali	nawazish@honda.com.pk
Mobilink Beenish	beenish.tariq@mobilink.net
Ufone Naveed Ahmed	ahmed.naveed@ufone.com
Mobilink Naeem Siddique	naeem.siddique@mobilink.net
Honda Muhammad Ali	muhammad.ali@honda.com.pk
DG Amjad	ambashir@dgcement.com
Honda Zaman Khan	zaman@honda.com.pk
Huawei Fatima Sameeullah	fatima.sameeullah@huawei.com
Qarshi Shafqat Niaz	shafqat.niaz@qarshi.com
Qarshi Moeed Aziz	moeed.aziz@qarshi.com
System LImited Ehtesham opel	ehtesham.opel@systemsltd.com
ZIC Aziz ur Rehman	Azizur.rehman@masgroup.org
ZiC Ashraf	ashraf@masgroup.org
Mezan Moazzam	moazzam.Iqbal@mezangrp.com
Mezan Mohsin	mohsin@mezangrp.com
Mezan Farhan Noorani	farhan@mezangrp.com
Ericsson Rawas Sultan	rawas.sultan.sultan@ericsson.com
IEC Tahir Sibtain	tahir.sibtain@iec.com.pk
Mobilink Shuja Hussain	shuja.hussain@mobilink.net
Sapphire Syed mansoor	mansoor.tayyab@sapphirefibres.com
IEC Sajid Jamil	sjamil@iec.com.pk
SNGPL Nadeem Nisar	nadeem.nisar@sngpl.com.pk
Mobilink-Proc-Azhar Lodhi	azhar.lodhi@jazz.com.pk
Schiendar Touseef	touseef.apc@gmail.com
shaheen galileo	shaheen.premani@travelport.com.pk
Schneider Munib-Khawaja	Munib.Khawaja@schneider-electric.com
Pak Kuwait Muhammad	ali@pakkuwait.com
Sapphire Naveed	naveed.aslam@sapphiremills.com
Zong Muhammad Farooq	muhammad.farooq@zong.com.pk
SOHAIL-SHAFIQ	sohail.shafique@etimaad.com
Ufone Munir hussain	Munir.hussain@ufonegsm.net
State Bank Ajaz-Hussain	Ajaz.Hussain@sbp.org.pk
Teradata Asad	Asad.Haq@Teradata.com
Teradata Khurram Rahat	Khuram.Rahat@Teradata.com
Zong Sulman Mansoor	Sulman.Mansoor@zong.com.pk
LTC Hassan Naeem	hassan.naaem@ptc.gop.pk
PAF Wing Commander Umar	umarpaf@gmail.com
PAF Salman Ahmad	salman28isb@hotmail.com
PEPSI-Fahad	m.fahad@pepsi-lahore.com.pk
PITB Waqar	waqar@pitb.gov.pk
Netsoft WiFi Yasir Gulzar	yasir@netsoft-solutions.net
Netsoft Yasir	yasir@netsoft-solutions.net
PTCL Adnan-Ansari	adnan.ansari@ptcl.net.pk
LTC COO Zafar Ahmed	zafar.ahmed@ptc.gop.pk
Sapphire Mujahid	mujahid.akbar@lhr.sapphire.com.pk
SNGPL DR Zafar Alvi	zafar.alvi@sngpl.com.pk
Sngpl Yasir	yasir.mirza@sngpl.com.pk
Teradata azam	muhammed.azam@teradata.com
Teradata Mohammad Zeeshan	mohammad.khan@teradata.com
Ufone CIO Saad Waraich	saad.waraich@ufonegsm.net
Ufone Junaid Jamil	junaid.jamil@ufonegsm.net
Ufone Rizwan Ahmad	rizwan.ahmad@ufonegsm.net
Wasiq	wasiq.naveed@tetrapak.com
Zong Pro Noman Aslam	noman.aslam@zong.com.pk
Zong Wajid	muhammad.wajid@zong.com.pk
Mobilink Adeel Ahmed	adeel.ahmed@mobilink.net
LTC Farhan	Farhan.alvi@ptc.gop.pk
Multilynx Hamid CH	hamid.chaudhry@multilynx.pk
Ibrahim fiber saleem	Saleem.Akhtar@igc.com.pk
Ericsson AATIF	aatif.nazir@ericsson.com
IbraheemFiber-Sana Anees	sana.anees@IGC.COM.PK
Evacuee Trust Shabana	shabanaetpb@yahoo.com
Fire-Safe Shahzad-Zaman	shehzad.z@haseenhabibcorp.com
Mobilink Proc Sajid Hussain	sajid.khan1@jazz.com.pk
Iftikhar Niazi	niazi.iftikhar@hotmail.com
FatimahGroup Sonia Lateef	sonia.lateef@fatima-group.com
Ericsson Irfan UlHaq	Irfan.Ulhaq@ericsson.com
Mobilink Dir Jawad	Jawad.aslam@mobilink.net
Mobilink IN-Atif Mustafa	ATIF.MUSTAFA@mobilink.net
Mobilink MFS Fahad Sajid	FAHAD.S@mobilink.net
Mobilink Waheed Niazi	Waheed.niazi@mobilink.net
Mobilink Fahad-Imran-Butt/IT/LHR	fahad@mobilink.net
Ericsson-Waqas-Naeem	waqas.naeem@ericsson.com
MobilinkAamer Hussain	aamer.hussain@mobilink.net
emerson Murad Azhar	murad.azhar@emerson.com
Ericsson	muhammad.irfan.khan@ericsson.com
Ericsson Aamir Intisar	aamir.intisar@ericsson.com
Ericsson Ali Faheem	ali.faheem@ericsson.com
Ericsson Avni Sahin	avni.sahin@ericsson.com
Ericsson Fahd Bukhari	fahd.bukhari@ericsson.com
Ericsson Farid Ahmad	farid.ahmad@ericsson.com
Ericsson Kashif Jameel	kashif.jameel@ericsson.com
Ericsson Mansoor Shahid	mansoor.shahid@ericsson.con
Ericsson Naeem Hayat	naeem.hayat@ericsson.com
Ericsson Pro Ahmad Abbas Ghaznavi	ahmad.abbas.ghaznavi@ericsson.com
Ericsson Services Bilal Rafi	bilal.rafi@ericsson.com
Ericsson Shakeel	shakeel.khawaja@ericsson.com
Ericsson Shoaib Akhtar	shoaib.akhtar@ericsson.com
Ericsson Sol-Adeel	adeel.ahmad@ericsson.com
ericsson Umar raja	umar.raja@ericsson.com
Ericsson Umer-Tariq	umer.tariq@ericsson.com
Ericsson-Finance Qaiser Niaz	qaisar.niaz@ericsson.com
ERICSSON-Imran Syed	imran.syed@ericsson.com
Ericsson-Shahid Malik-A	shahid.a.malik@ericsson.com
Express	anis.ahmed@expressnews.tv
Ibrahim-fibre Haider Farooq	haider.farooq@igc.com.pk
IGI Azeem Munir	azeem.minir@igi.com.pk
MCB Syed Nazim	mcb1048@mcb.com.pk
MCB-Salman Siddiqi	salman.siddiqi@mcb.com.pk
Mobilink Ayesha	ayesha.malik@mobilink.net
Mobilink DC Mohsin Khawaja	mohsin.khawaja@mobilink.net
Mobilink DR Sabeen ahmed	sabeen.a@mobilink.net
Mobilink Hafeez NOC	hafeez.ahmed@mobilink.net
Mobilink IN-Asif	a.iqbal@mobilink.net
Mobilink Mahrukh Malik	mahrukh.m@mobilink.net
Mobilink Mobin Yasin	mobin@mobilink.net
Mobilink NOC Sohaib Ahmed	sohaib.a@mobilink.net
Mobilink NW Muhammad Ali	ali.k@mobilink.net
Mobilink Pro Ali Rafeh	ali.rafeh@mobilink.net
Mobilink Pro Awais Nisar Malik	awais.malik@mobilink.net
Mobilink Pro PW Abdul Manan	manan.a@mobilink.net
Mobilink Proc Omair Iqbal	omair.iqbal@mobilink.net
Mobilink procur Ismail	muhammad.is@mobilink.net
Mobilink Procure Amjad	amjad.m@mobilink.net
Mobilink Rameez Rana/IT/LHR	rameez.rana@mobilink.net
Mobilink Sajeel Fahim	sajeel@mobilink.net
Mobilink Yousaf Allah Dad	yousaf.d@mobilink.net
Mobilink Zeeshan	zeeshan.masood@mobilink.net
Mobilink-Mamoon Lodhi	mamoon.lodhi@mobilink.net
Mobilink-Naveed-Ahmad-Chaudhri	naveed.c@mobilink.net
Mobilink-Shams	shams.ahmad@mobilink.net
Multilynx Zafar Kamal	zafar.kamal@multilynx.pk
MCB imtiaz	imtiaz.mahmood@mcb.com.pk
Ericsson Shadab Alam	shadab.alam@ericsson.com
Mobilink Procur Lalarukh Iqbal	lalarukh.iqbal@mobilink.net
ABL Mujahid.	mujahid.ali@abl.com
Chenab-IT Tahir Rameez	Tahir.Rameez@chenabgroup.com
ABL Hasan Jafri	Hasan.Jafri@abl.com
ABL Mubashir Ahmad	Mubashir.Ahmad@abl.com
ABL Naveed Iqbal	naveed.iqbal@abl.com
Autosoft Javed Mushtaq	javedmushtaq@autosoftdynamics.com
Borjan-ABDUL JABBAR	ABDUL.JABBAR@borjan.com.pk
Akhtar Chughtai	akhtar.chughtai@abmgroup.com
Ahsan Qamar	ahsanazizqamar@gmail.com
Chenab Mian Naeem	naeem@chenabgroup.com
Coca Azfar Ansari	aansari@ccbpl.com.pk
Descon Abdul-Sami	ashakir@jgc-descon.com.pk
Descon Shahnawaz	shahnawaz.khan@descon.com
BOP-Zulifqar Hussain	zulfiqar.hussain@bop.com.pk
Adamjee Najam-ul-Hassan	Najam.hassan@adamjeeinsurance.com
MCB CISO Suman Siddiqui	suman.siddiqui@mcb.com.pk
MCB P-Block Amna Mehmood	amna.mehmood@mcb.com.pk
IMMI Garments Aiman Javed	Aiman@immigarments.com
Maheen textile Syed Khurram	khurram.iftikhar@maheentex.com
PITB Faisal Yousaf	faisal@pitb.gov.pk
PITB Ata-ur-Rehman	ata.rahman@pitb.gov.pk
PITB Sajjad Ghani	sajjad@pitb.gov.pk
PITB Adil Iqbal Khan	adil.iqbal@pitb.gov.pk
Condoprotego Praj Calthorpe	praj@condoprotego.com
Sngpl_Usman _Qadeer	usman.qadeer@sngpl.com.pk
"""

rows = ["Name,Email"]
for line in raw_text.strip().splitlines():
    if not line.strip():
        continue
    parts = line.split('\t')
    if len(parts) == 2:
        name = parts[0].strip()
        email = parts[1].strip()
    else:
        # Regex split on space before email
        match = re.match(r'^(.*?)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$', line.strip())
        if match:
            name = match.group(1).strip()
            email = match.group(2).strip()
        else:
            continue
    if email and '@' in email:
        # Clean quotes
        name_clean = name.replace('"', '')
        rows.append(f'"{name_clean}",{email}')

csv_content = '\n'.join(rows)

import os
with open(r'c:\Users\awais\OneDrive\Documents\GitHub\mail_test_production\extracted_firms.csv', 'w', encoding='utf-8') as f:
    f.write(csv_content)

print(f"Successfully processed {len(rows)-1} rows.")
