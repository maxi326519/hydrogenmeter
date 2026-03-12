import { FullMediaModal } from "./FullMediaModal";
import React from "react";

import type { PhotoRecord } from "../../hooks/usePhotoStorage";

export interface FullImageModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string | null;
  record: PhotoRecord | null;
  onOpenImageViewer: (uri: string) => void;
  onUpdateRecord: (
    id: string,
    updates: Partial<Omit<PhotoRecord, "id" | "timestamp">>
  ) => Promise<PhotoRecord | null>;
  onRecordUpdated: (record: PhotoRecord) => void;
}

export const FullImageModal: React.FC<FullImageModalProps> = ({
  visible,
  onClose,
  imageUri,
  record,
  onOpenImageViewer,
  onUpdateRecord,
  onRecordUpdated,
}) => {
  return (
    <FullMediaModal<PhotoRecord>
      visible={visible}
      onClose={onClose}
      mediaType="image"
      mediaUri={imageUri}
      record={record}
      onOpenMedia={() => imageUri && onOpenImageViewer(imageUri)}
      onUpdateRecord={onUpdateRecord}
      onRecordUpdated={onRecordUpdated}
    />
  );
};
