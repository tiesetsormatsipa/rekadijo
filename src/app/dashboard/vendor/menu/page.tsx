import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatZAR } from "@/lib/utils";
import { NewCategoryForm } from "./new-category-form";
import { NewItemForm } from "./new-item-form";
import { MenuItemRow } from "./menu-item-row";

export default async function VendorMenuPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }] },
    include: {
      menuCategories: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: { options: true, media: true }
          }
        }
      }
    }
  });
  if (!business) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-900">Menu</h1>
          <p className="mt-1 text-charcoal-500">Manage categories, items, pricing, media, and ordering eligibility.</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-4 shadow-card">
        <NewCategoryForm businessId={business.id} />
      </div>

      <div className="mt-8 space-y-8">
        {business.menuCategories.map((category) => (
          <div key={category.id}>
            <h2 className="font-display text-xl font-semibold text-charcoal-900">{category.name}</h2>
            <div className="mt-3 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
              {category.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  businessId={business.id}
                  categories={business.menuCategories.map((c) => ({ id: c.id, name: c.name }))}
                  item={{
                    id: item.id,
                    name: item.name,
                    priceLabel: `${formatZAR(Number(item.basePrice))}${item.unitLabel ? ` / ${item.unitLabel}` : ""} · min ${item.minQuantity}${item.maxQuantity ? `, max ${item.maxQuantity}` : ""}`,
                    allowInstantOrder: item.allowInstantOrder,
                    allowQuotation: item.allowQuotation,
                    showStockToBuyer: item.showStockToBuyer,
                    isActive: item.isActive,
                    mediaUrl: item.media[0]?.url ?? null,
                    description: item.description,
                    categoryId: item.categoryId,
                    basePrice: item.basePrice,
                    unitLabel: item.unitLabel,
                    minQuantity: item.minQuantity,
                    maxQuantity: item.maxQuantity,
                    dietaryTags: item.dietaryTags,
                    mediaId: item.media[0]?.id ?? null
                  }}
                />
              ))}
              {category.items.length === 0 && <p className="p-4 text-sm text-charcoal-400">No items in this category yet.</p>}
            </div>
          </div>
        ))}

        {business.menuCategories.length > 0 && (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-4 shadow-card">
            <NewItemForm
              businessId={business.id}
              categories={business.menuCategories.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>
        )}

        {business.menuCategories.length === 0 && (
          <p className="rounded-xl border border-dashed border-charcoal-200 p-8 text-center text-sm text-charcoal-500">
            Add a category above before adding menu items.
          </p>
        )}
      </div>
    </div>
  );
}
