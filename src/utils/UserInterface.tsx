import { bottts } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

export async function getAvatar(avatarSeed: string | undefined) {
    const avatar = await createAvatar(bottts, {
      seed: avatarSeed,
    });

    return "data:image/svg+xml;utf8" + avatar.toString();
  }