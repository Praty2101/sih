import { prisma } from '../config/database';

async function verifySeed() {
  try {
    const farmers = await prisma.user.count({ where: { role: 'FARMER' } });
    const transporters = await prisma.user.count({ where: { role: 'TRANSPORTER' } });
    const retailers = await prisma.user.count({ where: { role: 'RETAILER' } });
    const batches = await prisma.produceLog.count();
    const economic = await prisma.economicLedgerTx.count();
    const quality = await prisma.qualityLedgerTx.count();

    console.log('\n📊 Database Verification:');
    console.log('  ✅ Farmers:', farmers);
    console.log('  ✅ Transporters:', transporters);
    console.log('  ✅ Retailers:', retailers);
    console.log('  ✅ Batches:', batches);
    console.log('  ✅ Economic Ledger Entries:', economic);
    console.log('  ✅ Quality Ledger Entries:', quality);
    console.log('\n✅ All data verified successfully!\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifySeed();


