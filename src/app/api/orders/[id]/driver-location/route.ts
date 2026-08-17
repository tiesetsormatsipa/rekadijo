import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: orderId } = await params;

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        driverAssignment: {
          include: {
            driver: true
          }
        }
      }
    });

    if (!order || order.buyerId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.driverAssignment || !order.driverAssignment.driver) {
      return NextResponse.json({ lat: null, lng: null });
    }

    const driver = order.driverAssignment.driver;
    return NextResponse.json({
      lat: driver.currentLat ? Number(driver.currentLat) : null,
      lng: driver.currentLng ? Number(driver.currentLng) : null
    });
  } catch (error) {
    console.error("Failed to fetch driver location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location" },
      { status: 500 }
    );
  }
}
