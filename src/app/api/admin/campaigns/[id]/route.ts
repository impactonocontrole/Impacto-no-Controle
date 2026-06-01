import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/adminAuth";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const { supabase, appUser } = await requireAdminFromRequest(request);

    const { data: campaign, error: campaignError } = await supabase
      .from("admin_campaigns_overview")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (campaignError || !campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    if (appUser.role !== "owner" && appUser.client_id !== campaign.client_id) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    const [numbersRes, contributionsRes, messagesRes, statsRes] = await Promise.all([
      supabase.from("campaign_numbers").select("number,status,buyer_display_name").eq("campaign_id", id).order("number"),
      supabase.from("admin_contributions").select("*").eq("campaign_id", id).order("created_at", { ascending: false }),
      supabase.from("message_templates").select("id,title,body,channel,purpose").eq("campaign_id", id).order("sort_order"),
      supabase.from("campaign_stats_public").select("*").eq("campaign_id", id).maybeSingle(),
    ]);

    if (numbersRes.error) throw numbersRes.error;
    if (contributionsRes.error) throw contributionsRes.error;
    if (messagesRes.error) throw messagesRes.error;
    if (statsRes.error) throw statsRes.error;

    return NextResponse.json({ campaign, numbers: numbersRes.data || [], contributions: contributionsRes.data || [], messages: messagesRes.data || [], stats: statsRes.data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Acesso não autorizado ou erro ao carregar campanha." }, { status: 401 });
  }
}
