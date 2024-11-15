export const mockData = {
  user: {
    fullName: "Demo User",
    email: "demo@example.com",
    imageUrl: "https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/6722f2e1aa50560b1eae60a1_favicon-nodable-knowledge.png"
  },
  calls: {
    // Reference existing mock data from data-utils.ts
    // ...generateCallVolumeData(),
    metrics: {
      totalCalls: 12345,
      totalSpend: 12345,
      transfers: 1234,
      costPerTransfer: 10.00
    }
  },
  billing: {
    creditBalance: 5000,
    nextBillingDate: new Date(),
    paymentMethod: {
      last4: "4242",
      expMonth: 12,
      expYear: 2025,
      brand: "visa"
    }
  }
} 