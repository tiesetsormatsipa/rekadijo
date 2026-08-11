import { PrismaClient, GlobalRole, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEV_PASSWORD = "Password@123";

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function ensurePermissions() {
  const defs = [
    ["quotation.view", "View quotations", "quotation"],
    ["quotation.respond", "Accept / decline / revise quotations", "quotation"],
    ["menu.edit", "Edit menu items and categories", "menu"],
    ["branch.edit", "Edit branch details", "business"],
    ["branch.availability.edit", "Edit branch item availability & stock", "business"],
    ["order.manage", "Manage orders and fulfillment", "order"],
    ["staff.manage", "Invite and manage staff", "business"],
    ["business.settings.edit", "Edit business-wide settings", "business"],
    ["business.verify", "Verify or reject vendor businesses", "admin"],
    ["business.suspend", "Suspend or restore businesses", "admin"],
    ["user.suspend", "Suspend or restore user accounts", "admin"],
    ["platform.settings.edit", "Edit platform-wide settings", "admin"]
  ] as const;

  for (const [key, label, category] of defs) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, label, category }
    });
  }
}

async function ensureSystemRoles() {
  const allPerms = await prisma.permission.findMany();
  const byKey = (k: string) => allPerms.find((p) => p.key === k)!;

  const roleDefs: Record<string, string[]> = {
    vendor_owner: allPerms.map((p) => p.key),
    vendor_manager: [
      "quotation.view",
      "quotation.respond",
      "menu.edit",
      "branch.edit",
      "branch.availability.edit",
      "order.manage"
    ],
    vendor_kitchen: ["quotation.view", "order.manage", "branch.availability.edit"],
    support_admin: ["business.verify", "business.suspend", "user.suspend", "platform.settings.edit"]
  };

  for (const [key, permKeys] of Object.entries(roleDefs)) {
    const role = await prisma.role.upsert({
      where: { key },
      update: {},
      create: { key, name: key.replace(/_/g, " "), isSystem: true }
    });
    for (const pk of permKeys) {
      const perm = byKey(pk);
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id }
      });
    }
  }
}

async function main() {
  console.log("Seeding RekaDijo development data...");

  await ensurePermissions();
  await ensureSystemRoles();

  const passwordHash = await hash(DEV_PASSWORD);

  // ── Seed users ──────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "superadmin@rekadijo.co.za" },
    update: {},
    create: {
      email: "superadmin@rekadijo.co.za",
      passwordHash,
      firstName: "Thandeka",
      lastName: "Root",
      globalRole: GlobalRole.SUPERADMIN,
      status: "ACTIVE",
      isDevSeed: true
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@rekadijo.co.za" },
    update: {},
    create: {
      email: "admin@rekadijo.co.za",
      passwordHash,
      firstName: "Karabo",
      lastName: "Ops",
      globalRole: GlobalRole.ADMIN,
      status: "ACTIVE",
      isDevSeed: true
    }
  });

  const supportAdminRole = await prisma.role.findUnique({ where: { key: "support_admin" } });
  if (supportAdminRole) {
    const existingAdminRole = await prisma.userRole.findFirst({
      where: { userId: admin.id, roleId: supportAdminRole.id, businessId: null }
    });
    if (!existingAdminRole) {
      await prisma.userRole.create({ data: { userId: admin.id, roleId: supportAdminRole.id } });
    }
  }

  const vendorOwner = await prisma.user.upsert({
    where: { email: "vendor@rekadijo.co.za" },
    update: {},
    create: {
      email: "vendor@rekadijo.co.za",
      passwordHash,
      firstName: "Tumelo",
      lastName: "Matsipa",
      globalRole: GlobalRole.VENDOR_OWNER,
      status: "ACTIVE",
      isDevSeed: true
    }
  });

  const vendorStaff = await prisma.user.upsert({
    where: { email: "staff@rekadijo.co.za" },
    update: {},
    create: {
      email: "staff@rekadijo.co.za",
      passwordHash,
      firstName: "Lindiwe",
      lastName: "Sithole",
      globalRole: GlobalRole.VENDOR_STAFF,
      status: "ACTIVE",
      isDevSeed: true
    }
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@rekadijo.co.za" },
    update: {},
    create: {
      email: "buyer@rekadijo.co.za",
      passwordHash,
      firstName: "Naledi",
      lastName: "Mokoena",
      globalRole: GlobalRole.BUYER,
      status: "ACTIVE",
      isDevSeed: true
    }
  });

  const driverUser = await prisma.user.upsert({
    where: { email: "driver@rekadijo.co.za" },
    update: {},
    create: {
      email: "driver@rekadijo.co.za",
      passwordHash,
      firstName: "Sipho",
      lastName: "Nkosi",
      globalRole: GlobalRole.DRIVER,
      status: "ACTIVE",
      isDevSeed: true
    }
  });

  await prisma.driverProfile.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      vehicleType: "Bakkie",
      licensePlate: "NC 12 KM GP",
      isAvailable: true,
      avgRating: 4.8,
      ratingCount: 34
    }
  });

  // ── TR. Matsipa Market — multi-branch business ─────────────────────
  const business = await prisma.business.upsert({
    where: { slug: "tr-matsipa-market" },
    update: {},
    create: {
      slug: "tr-matsipa-market",
      name: "TR. Matsipa Market",
      ownerId: vendorOwner.id,
      description:
        "Home-style baking, ginger beer, and takeaways serving the Northern Cape — proudly quotation-first for bulk and event orders, with instant ordering for everyday chips and bread where available.",
      category: "Home-cooked & Bakery",
      status: "APPROVED",
      orderingMode: "BOTH",
      whatsapp: "+27671714777",
      email: "orders@trmatsipamarket.co.za",
      minOrderAmount: 50,
      leadTimeHours: 24,
      quotationResponseHours: 24,
      avgRating: 4.6,
      reviewCount: 58,
      verifiedAt: new Date()
    }
  });

  await prisma.businessStaff.upsert({
    where: { businessId_userId: { businessId: business.id, userId: vendorOwner.id } },
    update: {},
    create: { businessId: business.id, userId: vendorOwner.id, role: StaffRole.OWNER, joinedAt: new Date() }
  });
  await prisma.businessStaff.upsert({
    where: { businessId_userId: { businessId: business.id, userId: vendorStaff.id } },
    update: {},
    create: { businessId: business.id, userId: vendorStaff.id, role: StaffRole.MANAGER, joinedAt: new Date() }
  });

  const vendorManagerRole = await prisma.role.findUnique({ where: { key: "vendor_manager" } });
  if (vendorManagerRole) {
    const existingStaffRole = await prisma.userRole.findFirst({
      where: { userId: vendorStaff.id, roleId: vendorManagerRole.id, businessId: business.id }
    });
    if (!existingStaffRole) {
      await prisma.userRole.create({ data: { userId: vendorStaff.id, roleId: vendorManagerRole.id, businessId: business.id } });
    }
  }

  // Branches — as specified in the product brief
  const warrenton = await prisma.branch.upsert({
    where: { id: "branch-warrenton-seed" },
    update: {},
    create: {
      id: "branch-warrenton-seed",
      businessId: business.id,
      name: "TR. Matsipa Market — Warrenton",
      addressLine: "639 Mgina Street, Ikhutseng",
      suburb: "Ikhutseng",
      city: "Warrenton",
      postalCode: "8530",
      latitude: -28.1136,
      longitude: 24.8472,
      fulfillmentType: "EITHER",
      deliveryRadiusKm: 12,
      isActive: true,
      acceptsInstantOrders: true
    }
  });

  const kimberley = await prisma.branch.upsert({
    where: { id: "branch-kimberley-seed" },
    update: {},
    create: {
      id: "branch-kimberley-seed",
      businessId: business.id,
      name: "TR. Matsipa Market — Kimberley",
      addressLine: "13239 Matsebe Street, Bloemanda",
      suburb: "Bloemanda",
      city: "Kimberley",
      postalCode: "8345",
      latitude: -28.7282,
      longitude: 24.7499,
      fulfillmentType: "EITHER",
      deliveryRadiusKm: 15,
      isActive: true,
      acceptsInstantOrders: true
    }
  });

  const jankempdorp = await prisma.branch.upsert({
    where: { id: "branch-jankempdorp-seed" },
    update: {},
    create: {
      id: "branch-jankempdorp-seed",
      businessId: business.id,
      name: "TR. Matsipa Market — Jan Kempdorp",
      addressLine: "Main Road, Jan Kempdorp",
      suburb: null,
      city: "Jan Kempdorp",
      postalCode: "8550",
      latitude: -27.9256,
      longitude: 24.8296,
      fulfillmentType: "PICKUP",
      deliveryRadiusKm: 0,
      isActive: true,
      acceptsInstantOrders: false
    }
  });

  const branches = [warrenton, kimberley, jankempdorp];

  for (const branch of branches) {
    for (let day = 0; day < 7; day++) {
      await prisma.operatingHour.upsert({
        where: { branchId_dayOfWeek: { branchId: branch.id, dayOfWeek: day } },
        update: {},
        create: {
          branchId: branch.id,
          dayOfWeek: day,
          openTime: day === 0 ? "09:00" : "07:30",
          closeTime: day === 0 ? "14:00" : "18:00",
          isClosed: false
        }
      });
    }
  }

  await prisma.deliveryZone.upsert({
    where: { id: "zone-warrenton-seed" },
    update: {},
    create: {
      id: "zone-warrenton-seed",
      businessId: business.id,
      branchId: warrenton.id,
      name: "Warrenton & surrounds (within 12km)",
      maxRadiusKm: 12,
      deliveryFee: 35
    }
  });
  await prisma.deliveryZone.upsert({
    where: { id: "zone-kimberley-seed" },
    update: {},
    create: {
      id: "zone-kimberley-seed",
      businessId: business.id,
      branchId: kimberley.id,
      name: "Kimberley & surrounds (within 15km)",
      maxRadiusKm: 15,
      deliveryFee: 40
    }
  });

  // ── Menu ─────────────────────────────────────────────────────────
  const bakedCategory = await prisma.menuCategory.upsert({
    where: { id: "cat-baked-seed" },
    update: {},
    create: { id: "cat-baked-seed", businessId: business.id, name: "Home Baking", sortOrder: 1 }
  });
  const drinksCategory = await prisma.menuCategory.upsert({
    where: { id: "cat-drinks-seed" },
    update: {},
    create: { id: "cat-drinks-seed", businessId: business.id, name: "Ginger Beer", sortOrder: 2 }
  });
  const takeawayCategory = await prisma.menuCategory.upsert({
    where: { id: "cat-takeaway-seed" },
    update: {},
    create: { id: "cat-takeaway-seed", businessId: business.id, name: "Takeaways", sortOrder: 3 }
  });

  const biscuits = await prisma.menuItem.upsert({
    where: { id: "item-biscuits-seed" },
    update: {},
    create: {
      id: "item-biscuits-seed",
      businessId: business.id,
      categoryId: bakedCategory.id,
      name: "Home Baked Biscuits",
      description: "Traditional home-baked biscuits, sold in bulk 20L buckets — perfect for church and event orders.",
      basePrice: 450,
      unitLabel: "20L bucket",
      minQuantity: 1,
      maxQuantity: 20,
      allowInstantOrder: false,
      allowQuotation: true
    }
  });

  const scones = await prisma.menuItem.upsert({
    where: { id: "item-scones-seed" },
    update: {},
    create: {
      id: "item-scones-seed",
      businessId: business.id,
      categoryId: bakedCategory.id,
      name: "Scones",
      description: "Fresh-baked scones, sold per dozen.",
      basePrice: 90,
      unitLabel: "dozen",
      minQuantity: 1,
      maxQuantity: 50,
      allowInstantOrder: false,
      allowQuotation: true
    }
  });

  const bread = await prisma.menuItem.upsert({
    where: { id: "item-bread-seed" },
    update: {},
    create: {
      id: "item-bread-seed",
      businessId: business.id,
      categoryId: bakedCategory.id,
      name: "Homemade Bread",
      description: "Freshly baked homemade bread loaves.",
      basePrice: 35,
      unitLabel: "loaf",
      minQuantity: 1,
      maxQuantity: 100,
      allowInstantOrder: true,
      allowQuotation: true,
      dietaryTags: ["VEGETARIAN"]
    }
  });

  const gingerBeer = await prisma.menuItem.upsert({
    where: { id: "item-gingerbeer-seed" },
    update: {},
    create: {
      id: "item-gingerbeer-seed",
      businessId: business.id,
      categoryId: drinksCategory.id,
      name: "Ginger Beer",
      description: "Traditional home-brewed ginger beer. Choose your size.",
      basePrice: 30,
      unitLabel: "bottle",
      minQuantity: 1,
      maxQuantity: 200,
      allowInstantOrder: false,
      allowQuotation: true,
      dietaryTags: ["VEGAN", "VEGETARIAN"]
    }
  });
  await prisma.menuItemOption.createMany({
    skipDuplicates: true,
    data: [
      { id: "opt-gb-2l", menuItemId: gingerBeer.id, name: "Size", choiceLabel: "2L", priceDelta: 0, isDefault: true },
      { id: "opt-gb-5l", menuItemId: gingerBeer.id, name: "Size", choiceLabel: "5L", priceDelta: 45 },
      { id: "opt-gb-20l", menuItemId: gingerBeer.id, name: "Size", choiceLabel: "20L", priceDelta: 220 }
    ]
  });

  const chips = await prisma.menuItem.upsert({
    where: { id: "item-chips-seed" },
    update: {},
    create: {
      id: "item-chips-seed",
      businessId: business.id,
      categoryId: takeawayCategory.id,
      name: "Fries / Chips",
      description: "Freshly fried chips, available in three sizes.",
      basePrice: 20,
      unitLabel: "portion",
      minQuantity: 1,
      maxQuantity: 100,
      allowInstantOrder: true,
      allowQuotation: true,
      dietaryTags: ["VEGETARIAN", "VEGAN"]
    }
  });
  await prisma.menuItemOption.createMany({
    skipDuplicates: true,
    data: [
      { id: "opt-chips-s", menuItemId: chips.id, name: "Size", choiceLabel: "Small", priceDelta: 0, isDefault: true },
      { id: "opt-chips-m", menuItemId: chips.id, name: "Size", choiceLabel: "Medium", priceDelta: 10 },
      { id: "opt-chips-l", menuItemId: chips.id, name: "Size", choiceLabel: "Large", priceDelta: 20 }
    ]
  });

  const menuItems = [biscuits, scones, bread, gingerBeer, chips];

  // ── Branch-specific availability rules (exactly as specified) ─────
  for (const branch of branches) {
    for (const item of menuItems) {
      let isAvailable = true;
      let isInstantOrderable = item.allowInstantOrder;
      let stockQuantity: number | null = 40;

      // Rule: In Warrenton, homemade bread is NOT available.
      if (branch.id === warrenton.id && item.id === bread.id) {
        isAvailable = false;
      }

      // Rule: Jan Kempdorp is pickup-only / testing branch — smaller stock, no instant ordering.
      if (branch.id === jankempdorp.id) {
        isInstantOrderable = false;
        stockQuantity = 10;
      }

      await prisma.branchItemAvailability.upsert({
        where: { branchId_menuItemId: { branchId: branch.id, menuItemId: item.id } },
        update: {},
        create: {
          branchId: branch.id,
          menuItemId: item.id,
          isAvailable,
          isInstantOrderable,
          stockQuantity,
          lowStockThreshold: 5
        }
      });
    }
  }

  // ── A sample quotation request in flight (buyer -> Warrenton branch) ─
  const quotation = await prisma.quotation.upsert({
    where: { reference: "RQ-2026-100420" },
    update: {},
    create: {
      reference: "RQ-2026-100420",
      businessId: business.id,
      branchId: warrenton.id,
      buyerId: buyer.id,
      source: "BUYER_INITIATED",
      status: "PENDING",
      eventType: "Church order",
      fulfillmentType: "PICKUP",
      requestedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: "Needed for Sunday fellowship — please confirm biscuit flavors available.",
      subtotal: 1350,
      total: 1350,
      sizeCategory: "LARGE",
      estimatedServings: 120,
      items: {
        create: [
          {
            menuItemId: biscuits.id,
            nameSnapshot: biscuits.name,
            quantity: 3,
            unitPrice: 450,
            lineTotal: 1350
          }
        ]
      }
    }
  });

  // ── Sample promotion ────────────────────────────────────────────────
  await prisma.promotion.upsert({
    where: { code: "WELCOME20" },
    update: {},
    create: {
      code: "WELCOME20",
      scope: "BUSINESS",
      businessId: business.id,
      type: "PERCENTAGE_OFF",
      value: 20,
      minOrderAmount: 50,
      maxDiscount: 60,
      perUserLimit: 1,
      isActive: true
    }
  });

  console.log("Seed complete.");
  console.log("─────────────────────────────────────────");
  console.log("Dev accounts (all use password: Password@123)");
  console.log("  SuperAdmin : superadmin@rekadijo.co.za");
  console.log("  Admin      : admin@rekadijo.co.za");
  console.log("  Vendor     : vendor@rekadijo.co.za");
  console.log("  Staff      : staff@rekadijo.co.za");
  console.log("  Buyer      : buyer@rekadijo.co.za");
  console.log("  Driver     : driver@rekadijo.co.za");
  console.log("Seed business: TR. Matsipa Market (Warrenton, Kimberley, Jan Kempdorp)");
  console.log("Sample quotation:", quotation.reference);
  console.log("Sample promo code: WELCOME20 (20% off, min order R50, max R60 off)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
