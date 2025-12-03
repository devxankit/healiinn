/**
 * Script to Add Medicines to a Specific Pharmacy
 * 
 * This script adds medicines to a pharmacy identified by phone number
 * 
 * Run with: node backend/scripts/add-medicines-to-pharmacy.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');

// Medicine data to add
const medicinesData = [
  {
    name: 'Paracetamol',
    dosage: '500mg',
    quantity: 100,
    price: 2.50,
    manufacturer: 'Cipla Ltd',
    category: 'Analgesic',
    prescriptionRequired: false,
  },
  {
    name: 'Cetirizine',
    dosage: '10mg',
    quantity: 50,
    price: 1.75,
    manufacturer: 'Sun Pharma',
    category: 'Antihistamine',
    prescriptionRequired: false,
  },
  {
    name: 'Amoxicillin',
    dosage: '250mg',
    quantity: 30,
    price: 5.00,
    manufacturer: 'Dr. Reddy\'s',
    category: 'Antibiotic',
    prescriptionRequired: true,
  },
  {
    name: 'Omeprazole',
    dosage: '20mg',
    quantity: 30,
    price: 3.50,
    manufacturer: 'Torrent Pharmaceuticals',
    category: 'Antacid',
    prescriptionRequired: false,
  },
  {
    name: 'Azithromycin',
    dosage: '500mg',
    quantity: 6,
    price: 8.00,
    manufacturer: 'Cipla Ltd',
    category: 'Antibiotic',
    prescriptionRequired: true,
  },
  {
    name: 'Ibuprofen',
    dosage: '400mg',
    quantity: 100,
    price: 3.00,
    manufacturer: 'Zydus Cadila',
    category: 'NSAID',
    prescriptionRequired: false,
  },
  {
    name: 'Metformin',
    dosage: '500mg',
    quantity: 60,
    price: 2.25,
    manufacturer: 'USV Ltd',
    category: 'Antidiabetic',
    prescriptionRequired: true,
  },
  {
    name: 'Atorvastatin',
    dosage: '10mg',
    quantity: 30,
    price: 4.50,
    manufacturer: 'Lupin',
    category: 'Cholesterol',
    prescriptionRequired: true,
  },
  {
    name: 'Amlodipine',
    dosage: '5mg',
    quantity: 30,
    price: 3.75,
    manufacturer: 'Glenmark',
    category: 'Antihypertensive',
    prescriptionRequired: true,
  },
  {
    name: 'Montelukast',
    dosage: '10mg',
    quantity: 30,
    price: 6.00,
    manufacturer: 'Cipla Ltd',
    category: 'Antiasthmatic',
    prescriptionRequired: true,
  },
  {
    name: 'Pantoprazole',
    dosage: '40mg',
    quantity: 30,
    price: 4.00,
    manufacturer: 'Sun Pharma',
    category: 'Antacid',
    prescriptionRequired: false,
  },
  {
    name: 'Diclofenac',
    dosage: '50mg',
    quantity: 30,
    price: 2.75,
    manufacturer: 'Novartis',
    category: 'NSAID',
    prescriptionRequired: false,
  },
  {
    name: 'Levocetirizine',
    dosage: '5mg',
    quantity: 30,
    price: 2.00,
    manufacturer: 'Dr. Reddy\'s',
    category: 'Antihistamine',
    prescriptionRequired: false,
  },
  {
    name: 'Ciprofloxacin',
    dosage: '500mg',
    quantity: 10,
    price: 7.50,
    manufacturer: 'Ranbaxy',
    category: 'Antibiotic',
    prescriptionRequired: true,
  },
  {
    name: 'Losartan',
    dosage: '50mg',
    quantity: 30,
    price: 3.25,
    manufacturer: 'Torrent Pharmaceuticals',
    category: 'Antihypertensive',
    prescriptionRequired: true,
  },
];

const addMedicinesToPharmacy = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Phone number to find pharmacy
    const phoneNumber = '7999267233';
    
    // Find pharmacy by phone number
    const pharmacy = await Pharmacy.findOne({ phone: phoneNumber });
    
    if (!pharmacy) {
      console.error(`❌ Pharmacy with phone number ${phoneNumber} not found!`);
      console.log('\nAvailable pharmacies:');
      const allPharmacies = await Pharmacy.find({}).select('pharmacyName phone email').limit(10);
      allPharmacies.forEach(p => {
        console.log(`  - ${p.pharmacyName} (Phone: ${p.phone}, Email: ${p.email})`);
      });
      process.exit(1);
    }

    console.log(`\n📋 Found Pharmacy: ${pharmacy.pharmacyName}`);
    console.log(`   Phone: ${pharmacy.phone}`);
    console.log(`   Email: ${pharmacy.email}`);
    console.log(`   ID: ${pharmacy._id}\n`);

    // Add medicines
    let addedCount = 0;
    let skippedCount = 0;

    for (const medicineData of medicinesData) {
      try {
        // Check if medicine already exists for this pharmacy
        const existing = await Medicine.findOne({
          pharmacyId: pharmacy._id,
          name: medicineData.name,
          dosage: medicineData.dosage,
        });

        if (existing) {
          console.log(`⏭️  Skipping: ${medicineData.name} (${medicineData.dosage}) - already exists`);
          skippedCount++;
          continue;
        }

        // Create medicine
        const medicine = await Medicine.create({
          pharmacyId: pharmacy._id,
          name: medicineData.name,
          dosage: medicineData.dosage,
          manufacturer: medicineData.manufacturer,
          quantity: medicineData.quantity,
          price: medicineData.price,
          category: medicineData.category,
          prescriptionRequired: medicineData.prescriptionRequired,
          isActive: true,
        });

        console.log(`✅ Added: ${medicine.name} (${medicine.dosage}) - ₹${medicine.price} - Qty: ${medicine.quantity}`);
        addedCount++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  Skipping: ${medicineData.name} (${medicineData.dosage}) - duplicate`);
          skippedCount++;
        } else {
          console.error(`❌ Error adding ${medicineData.name}:`, error.message);
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Added: ${addedCount} medicines`);
    console.log(`   ⏭️  Skipped: ${skippedCount} medicines`);
    console.log(`   📦 Total: ${medicinesData.length} medicines`);
    console.log('='.repeat(60));

    // Get total medicines count for this pharmacy
    const totalMedicines = await Medicine.countDocuments({
      pharmacyId: pharmacy._id,
      isActive: true,
    });
    console.log(`\n📦 Total active medicines in ${pharmacy.pharmacyName}: ${totalMedicines}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the script
addMedicinesToPharmacy();

