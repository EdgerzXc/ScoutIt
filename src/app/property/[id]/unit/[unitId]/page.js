import UnitMasterPage from "@/components/property/UnitMasterPage";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return {
    title: `Unit Intel — ${resolvedParams.id} — ScoutIt`,
    description: "Unit-level Space Intelligence Vector",
  };
}

export default async function UnitRoute({ params }) {
  const resolvedParams = await params;
  return <UnitMasterPage slug={resolvedParams.id} unitId={resolvedParams.unitId} />;
}
