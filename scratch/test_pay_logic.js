const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient, PaymentStatus, GiftStatus, PaymentType, TransactionType, TransactionStatus } = require('@prisma/client');
const crypto = require('crypto');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runPaymentLogic() {
  try {
    const test = await prisma.loyaltyTest.findFirst({
      where: { paymentStatus: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
    if (!test) {
      console.log('No pending tests found.');
      return;
    }
    const userId = test.senderId;
    const totalAmount = test.totalAmount;

    console.log('Test ID:', test.id);
    console.log('Sender ID:', userId);

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });
    
    if (!wallet) {
      console.log('No wallet found for sender.');
      return;
    }
    console.log('Wallet balance before:', wallet.balance);

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: totalAmount,
          },
        },
      });

      const txRef = `TX-CHARGE-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          transactionType: TransactionType.CHARGE,
          amount: totalAmount,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          reference: txRef,
          description: `Funded loyalty test link to ${test.receiverName} via Wallet Balance`,
          status: TransactionStatus.SUCCESSFUL,
        },
      });

      const gateRef = `WALLET-PAY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const payment = await tx.payment.create({
        data: {
          userId,
          testId: test.id,
          paymentType: PaymentType.TEST_FUNDING,
          gateway: "WALLET",
          gatewayReference: gateRef,
          amount: totalAmount,
          currency: "NGN",
          status: PaymentStatus.SUCCESSFUL,
          paidAt: new Date(),
        },
      });

      const updatedTest = await tx.loyaltyTest.update({
        where: { id: test.id },
        data: {
          paymentStatus: PaymentStatus.SUCCESSFUL,
          giftStatus: GiftStatus.ESCROW,
        },
      });

      return { updatedTest, payment };
    });

    console.log('Transaction success! Updated test status:', result.updatedTest.paymentStatus);
  } catch (e) {
    console.error('Transaction error:', e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}
runPaymentLogic();
