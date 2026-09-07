"use client";

import dynamic from "next/dynamic";
import { useMounted } from "@/hooks/useMounted";

const OfficeMapInner = dynamic(() => import("./OfficeMapInner"), {
  ssr: false,
  loading: () => <OfficeMapSkeleton/>,
});

function OfficeMapSkeleton(): React.ReactElement {
  return (
    <div
      className="h-80 w-full animate-pulse rounded-2xl bg-gray-100 ring-1 ring-gray-200
        dark:bg-gray-800 dark:ring-gray-700"
      aria-hidden="true"
    />
  );
}

interface OfficeMapProps {
  title?: string;
}

export default function OfficeMap({ title }: OfficeMapProps): React.ReactElement {
  const mounted = useMounted();
  if (!mounted) return <OfficeMapSkeleton/>;
  return <OfficeMapInner title={title}/>;
}
