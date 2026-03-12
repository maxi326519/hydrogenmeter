import React from "react";
import type { VideoRecord } from "../../hooks/useVideoStorage";
import { FullMediaModal } from "./FullMediaModal";

export interface FullVideoModalProps {
  visible: boolean;
  onClose: () => void;
  record: VideoRecord | null;
  onOpenVideoPlayer: () => void;
  onUpdateRecord: (
    id: string,
    updates: Partial<Omit<VideoRecord, "id" | "timestamp">>
  ) => Promise<VideoRecord | null>;
  onRecordUpdated: (record: VideoRecord) => void;
}

export const FullVideoModal: React.FC<FullVideoModalProps> = ({
  visible,
  onClose,
  record,
  onOpenVideoPlayer,
  onUpdateRecord,
  onRecordUpdated,
}) => {
  return (
    <FullMediaModal<VideoRecord>
      visible={visible}
      onClose={onClose}
      mediaType="video"
      mediaUri={record?.videoUri ?? null}
      record={record}
      onOpenMedia={onOpenVideoPlayer}
      onUpdateRecord={onUpdateRecord}
      onRecordUpdated={onRecordUpdated}
    />
  );
};
