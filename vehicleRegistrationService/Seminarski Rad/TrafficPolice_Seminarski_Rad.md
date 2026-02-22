# eUprava: Mikroservis Saobraćajne Policije

**Vukašin Čađenović**  
Fakultet tehničkih nauka  
Univerzitet u Novom Sadu  
Trg Dositeja Obradovića 6, 21000 Novi Sad  

---

**Sažetak**—U okviru modernizacije i digitalizacije javne uprave, sistemi eUprave se sve više oslanjaju na distribuirane, mikroservisne arhitekture. Ovaj rad predstavlja razvoj nezavisnog mikroservisa *TrafficPoliceService* koji simulira rad i evidenciju Saobraćajne policije u okviru većeg e-government sistema za registraciju vozila. Sistem omogućava policijskim službenicima izdavanje saobraćajnih prekršaja, evidentiranje saobraćajnih nezgoda, prijavu ukradenih vozila i upravljanje aktivnim nalozima (markiranje vozila). Građanima je omogućen uvid u sopstvene prekršaje, istoriju nezgoda i status prijavljenih ukradenih vozila, dok se plaćanje kazni obeležava kroz sistem uz automatsko generisanje PDF uplatnica. Poseban naglasak stavljen je na integraciju sa *VehicleRegistration* servisom, gde status vozila (ukradeno, pod istragom) direktno utiče na mogućnost njegove registracije ili prenosa vlasništva. Arhitektura je bazirana na programskom jeziku Golang uz Gin radni okvir, dok je klijentska strana implementirana u Angularu. Celokupan sistem je kontejnerizovan upotrebom Docker tehnologije.

**Ključne reči**—*saobraćajna policija; eUprava; mikroservisi; Golang; Angular; distribuirani sistemi*

---

## 1. Uvod

Digitalizacija javnih servisa donosi revoluciju u načinu na koji građani komuniciraju sa državnim institucijama. Jedan od ključnih aspekata te komunikacije odnosi se na sektor saobraćaja i bezbednosti. Tradicionalni procesi evidentiranja prekršaja, plaćanja kazni i provere statusa vozila često podrazumevaju odlazak na šaltere MUP-a, čekanje u redovima i manuelnu obradu papirne dokumentacije.

Razvojem *TrafficPolice* mikroservisa u okviru šire platforme eUprave, građanima se omogućava transparentan uvid u njihov dosije – od neplaćenih kazni do statusa ukradenih vozila. S druge strane, policijskim službenicima i administratorima sistem pruža moćan i brz alat za evidentiranje saobraćajnih incidenata, izdavanje kazni i markiranje sumnjivih vozila. 

Najveća snaga ovog servisa leži u njegovoj integraciji sa postojećim sistemom za registraciju vozila (*VehicleRegistrationService*). Naime, pre nego što građanin može da registruje vozilo ili izvrši prenos vlasništva, glavni servis upućuje HTTP poziv *TrafficPolice* servisu kako bi proverio da li je vozilo markirano, ukradeno ili ima neizmirene kazne. Ukoliko bilo šta od navedenog postoji, proces registracije se automatski blokira.

---

## 2. Arhitektura Sistema

Sistem prati stroge principe mikroservisne arhitekture. Zamišljen je kao potpuno nezavisna celina koja komunicira sa ostatkom eUprave putem HTTP REST API-ja i deli zajednički mehanizam autentifikacije zasnovan na JWT (JSON Web Token) standardu.

### 2.1. Back-end: TrafficPoliceService (Golang)
Odluka da se servis razvije u programskom jeziku **Go (Golang)** proizašla je iz potrebe za visokim performansama, malim utroškom memorije i odličnom podrškom za konkurentno programiranje (gorutine). 

Struktura servisa obuhvata:
- **Gin Web Framework:** Korišćen za efikasno rutiranje HTTP zahteva i definisanje REST API-ja.
- **GORM (Go Object Relational Mapper):** Upotrebljen za rad sa *Microsoft SQL Server* bazom podataka, omogućavajući automatizovanu migraciju šema i rad sa objektima (Officer, Violation, Accident, StolenVehicle, VehicleFlag).
- **JWT Autentifikacija:** Middleware koji presreće zahteve i dekodira JWT token koristeći isti tajni ključ (`JWT_SECRET`) i izdavača (`JWT_ISSUER`) kao i centralni *AuthService*.
- **Međuservisna Komunikacija:** Implementirana asinhrona obaveštenja (koristeći gorutine) prema *VehicleService*-u kada se prijavi saobraćajna nezgoda ili ukradeno vozilo, kako bi se održala konzistentnost podataka kroz čitav sistem.

### 2.2. Front-end: Angular
Klijentska aplikacija je proširenje postojećeg Angular portala, gde je kreiran poseban modul za Saobraćajnu policiju (`/saobracajna-policija`). Kako bi se izbegla prenatrpanost, interfejs je izdeljen na logičke celine (Tabove):
1. **Provera vozila (Dossier):** Agregira sve podatke o vozilu (ukradeno, kazne, nezgode) u jedan pregledni interfejs.
2. **Evidencija ukradenih vozila.**
3. **Prekršaji i Nezgode:** Pregled istorije i preuzimanje PDF uplatnica za kazne.
4. **Administracija (Admin Tab):** Pristupačan isključivo korisnicima sa ulogom `Admin` ili `TrafficOfficer`. Ovde službenici mogu izdavati nove prekršaje, prijavljivati nezgode, dodavati policijske službenike i markirati vozila (warrants).

Stilizacija je urađena upotrebom **Tailwind CSS**-a i **PrimeNG** biblioteke komponenata.

---

## 3. Implementacija i Funkcionalnosti

### 3.1. Upravljanje Prekršajima (Violations)
Kada policijski službenik zaustavi vozilo, preko Admin panela unosi podatke o prekršaju (tip, lokacija, iznos kazne). Sistem beleži status kazne kao `PENDING`. Građanin sa svog profila može videti ovu kaznu i označiti je kao plaćenu. 

*Specifična vrednost:* Implementirano je generisanje **PDF uplatnica** u realnom vremenu (koristeći `gofpdf` biblioteku u Go-u). Građanin može preuzeti PDF dokument koji sadrži sve podatke neophodne za uplatu (broj kazne, iznos, datum).

*(Mesto za sliku: Prikaz forme za dodavanje prekršaja)*
`[PLACEHOLDER_SLIKA_1_DODAVANJE_PREKRSAJA]`

*(Mesto za sliku: Prikaz tabele prekršaja sa opcijama za plaćanje i preuzimanje PDF-a)*
`[PLACEHOLDER_SLIKA_2_TABELA_PREKRSAJA]`

### 3.2. Prijavljivanje Ukradenih Vozila
Za razliku od izdavanja kazni, prijavu ukradenog vozila mogu izvršiti i sami građani. Kada se vozilo prijavi kao ukradeno, *TrafficPoliceService* ne samo da beleži ovaj podatak u lokalnu bazu podataka, već **asinhrono obaveštava glavni VehicleService** da vozilo stavi pod zabranu. Ovo sprečava eventualne pokušaje preprodaje ili preregistracije ukradenog vozila.

*(Mesto za sliku: Prikaz forme za prijavu ukradenog vozila)*
`[PLACEHOLDER_SLIKA_3_PRIJAVA_KRADJE]`

### 3.3. Agregacija Podataka (Vehicle Dossier)
Najmoćniji endpoint ovog servisa je `GET /api/police/status/:plate`. On kombinuje podatke iz četiri različite tabele u jedinstven *Dossier* objekat:
- Da li je vozilo ukradeno?
- Koje aktivne naloge (markiranja) ima?
- Koliko neplaćenih kazni ima (uz sumiran ukupan dug)?
- Koliko je u nezgodama učestvovalo u prošlosti?

Ovaj dosije MUP službenik vidi kroz čist i pregledan interfejs.

*(Mesto za sliku: Prikaz dosijea vozila - "Provera vozila" tab)*
`[PLACEHOLDER_SLIKA_4_DOSIJE_VOZILA]`

### 3.4. Uloge i Bezbednost (RBAC)
Kroz dekodiranje JWT tokena, Angular aplikacija prepoznaje ulogu korisnika (`User`, `Admin`, `TrafficOfficer`). U skladu sa tim:
- Obični korisnici mogu videti samo kazne i prijaviti krađu.
- Tab **"Administracija"** je skriven od običnih korisnika i dostupan je samo ovlašćenim licima. 
- Pokušaj API poziva na bekendu za kreiranje kazne od strane neovlašćenog lica biće odbijen zahvaljujući *AuthMiddleware*-u.

---

## 4. Zaključak i Dalja Unapređenja

Razvoj *TrafficPolice* mikroservisa uspešno zaokružuje funkcionalnosti simuliranog sistema eUprave, demonstrirajući pun potencijal labavo spojenih (loosely coupled) sistema. Odvojena arhitektura, gde ASP.NET Core komunicira sa Golang servisom putem HTTP-a, pokazuje kako različiti timovi mogu koristiti tehnologije koje im najviše odgovaraju, a da krajnji korisnik ima jedinstveno iskustvo kroz jedan frontend.

**Moguća dalja unapređenja uključuju:**
1. **Asinhrona razmena poruka (Message Queues):** Umesto direktnih HTTP poziva (poput obaveštavanja `VehicleService`-a o ukradenom vozilu), uvođenje *RabbitMQ* ili *Kafka* sistema bi obezbedilo da se poruke nikada ne izgube, čak i ako je ciljni servis privremeno nedostupan.
2. **Plaćanje kazni:** Trenutno je plaćanje samo mock-ovano klikom na dugme. Uvođenjem integracije sa stvarnim Payment Gateway-om (npr. Stripe) omogućilo bi se pravo elektronsko plaćanje.
3. **Grafička Analitika:** Implementacija grafikona na Admin panelu koji bi MUP-u prikazivali statistiku o vrstama prekršaja po gradovima i vremenskim periodima.

---

## 5. Reference
1. Golang zvanična dokumentacija, https://go.dev/doc/
2. Gin Web Framework, https://gin-gonic.com/
3. GORM - The fantastic ORM library for Golang, https://gorm.io/
4. Angular 18/19 Documentation, https://angular.dev/
5. Tailwind CSS, https://tailwindcss.com/
6. PrimeNG - UI Components for Angular, https://primeng.org/