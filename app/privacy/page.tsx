import PublicInfo from "@/components/public-info";
export default function Page() {
  return <PublicInfo params={Promise.resolve({ info: "privacy" })} />;
}
