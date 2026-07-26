import { PageLoader } from "@/components/ui/page-loader";

export default function Loading() {
  return (
    <PageLoader
      message="Loading Markivo..."
      subtext="Preparing your shopping experience."
      showNavbar={true}
    />
  );
}
