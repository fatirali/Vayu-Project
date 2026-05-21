import { LiveSessionRoom } from "./LiveSessionRoom";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params;
  return <LiveSessionRoom sessionId={sessionId} />;
}
