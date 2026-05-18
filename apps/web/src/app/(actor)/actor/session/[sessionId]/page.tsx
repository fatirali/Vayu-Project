import { ActorSessionRoom } from "./ActorSessionRoom";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function ActorSessionPage({ params }: Props) {
  const { sessionId } = await params;
  return <ActorSessionRoom sessionId={sessionId} />;
}
