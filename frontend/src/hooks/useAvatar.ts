import { createClient } from "@/lib/supabase";
import { useState } from "react";
import toast from "react-hot-toast";

const MAX_SIZE_PX = 400;
const QUALITY = 0.8;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_SIZE_PX || height > MAX_SIZE_PX) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE_PX) / width);
          width = MAX_SIZE_PX;
        } else {
          width = Math.round((width * MAX_SIZE_PX) / height);
          height = MAX_SIZE_PX;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
}

export function useAvatar() {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (
    file: File,
    userId: string,
  ): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("10MB以下の画像を選択してください");
      return null;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const filePath = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressed, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        toast.error("アップロードに失敗しました");
        console.error(uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (dbError) {
        toast.error("プロフィールの更新に失敗しました");
        console.error(dbError);
        return null;
      }

      toast.success("アバター画像を更新しました！");
      return publicUrl;
    } catch (err) {
      toast.error("エラーが発生しました");
      console.error(err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading };
}
