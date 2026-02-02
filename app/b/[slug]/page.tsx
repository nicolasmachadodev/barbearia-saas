import BookingClient from "./booking-client";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { getAvailableSlots } from "@/src/lib/booking/get-available-slots";
import { createPublicAppointment } from "./actions";

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{
        serviceId?: string;
        staffId?: string;
        date?: string;
        ok?: string;
    }>;
}) {
    const { slug } = await params;
    const { serviceId, staffId, date, ok } = await searchParams;

    const admin = createAdminClient();

    const { data: shop } = await admin
        .from("shops")
        .select("id, name, slug")
        .eq("slug", slug)
        .single();

    if (!shop) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100">
                <div className="mx-auto max-w-md p-6">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                        <h1 className="text-lg font-semibold">Barbearia não encontrada</h1>
                    </div>
                </div>
            </div>
        );
    }

    const { data: services } = await admin
        .from("services")
        .select("id, name, duration_min")
        .eq("shop_id", shop.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    const { data: staff } = await admin
        .from("staff")
        .select("id, name")
        .eq("shop_id", shop.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    let staffFiltered = staff ?? [];
    if (serviceId) {
        const { data: links } = await admin
            .from("staff_services")
            .select("staff_id")
            .eq("service_id", serviceId);

        const allowed = new Set((links ?? []).map((x: any) => x.staff_id));
        staffFiltered = (staff ?? []).filter((s: any) => allowed.has(s.id));
    }

    let slots: { time: string }[] = [];
    if (serviceId && staffId && date) {
        slots = await getAvailableSlots({
            shopId: shop.id,
            serviceId,
            staffId,
            date,
            slotStepMin: 15,
        });
    }

    // server action wrapper: pega fields do form e chama createPublicAppointment
    async function onCreateAppointment(formData: FormData) {
        "use server";
        const sId = String(formData.get("serviceId") ?? "");
        const stId = String(formData.get("staffId") ?? "");
        const d = String(formData.get("date") ?? "");
        const time = String(formData.get("time") ?? "");
        const customerName = String(formData.get("customerName") ?? "");
        const customerPhone = String(formData.get("customerPhone") ?? "");

        const { redirect } = await import("next/navigation");

        await createPublicAppointment({
            shopId: shop?.id ?? "",
            serviceId: sId,
            staffId: stId,
            date: d,
            time,
            customerName,
            customerPhone,
        });

        redirect(`/b/${encodeURIComponent(slug)}?ok=1`);
    }

    return (
        <BookingClient
            slug={slug}
            shopName={shop.name}
            services={(services ?? []) as any}
            staff={(staff ?? []) as any}
            staffFiltered={(staffFiltered ?? []) as any}
            initialServiceId={serviceId}
            initialStaffId={staffId}
            initialDate={date}
            slots={slots}
            ok={ok}
            onCreateAppointment={onCreateAppointment}
        />
    );
}
