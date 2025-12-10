import { auth } from "@dealort/auth";
import {
  createRouteHandler,
  createUploadthing,
  type FileRouter,
  UploadThingError,
} from "uploadthing/server";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
// const acceptedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

const f = createUploadthing();

function convertToHeaders(headers: unknown): Headers {
  if (headers instanceof Headers) {
    return headers;
  }

  const result = new Headers();
  const headerObj = headers as unknown as Record<string, string | string[]>;
  for (const [key, value] of Object.entries(headerObj)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        result.append(key, v);
      }
    } else {
      result.set(key, value);
    }
  }
  return result;
}

export const uploadRouter: FileRouter = {
  profileImage: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
      acl: "public-read",
    },
  })
    .middleware(async ({ req, files }) => {
      // Ensure headers are in the correct format for better-auth
      const headers = convertToHeaders(req.headers);

      // console.log("Cookie header:", headers.get("cookie"));
      // console.log("All headers:", Object.fromEntries(headers.entries()));

      const session = await auth.api.getSession({ headers });
      const user = session?.user;

      if (!user) throw new UploadThingError("Unauthorized");

      if (!acceptedImageTypes.includes(files[0]?.type ?? ""))
        throw new UploadThingError("Invalid file type");

      if (files?.length && files[0]?.size && files[0]?.size > 2 * 1024 * 1024)
        throw new UploadThingError("File size is larger than 2MB");

      if (files.length > 1) throw new UploadThingError("Only one file allowed");

      const fileName = `${user.id}-${user.name.split(" ").join("_").toLowerCase()}-${Date.now()}.${files[0]?.type?.split("/")[1]}`;

      return { userId: user.id, fileName };
    })
    .onUploadComplete(({ metadata, file }) => {
      // NOTE: This callback only works in production with a publicly accessible URL
      // (set via UPLOADTHING_CALLBACK_URL). In development, the update is handled
      // client-side via onClientUploadComplete.
      console.log("onUploadComplete called (production only)!");
      console.log("File URL:", file.url);

      // In production, you could update the database here if needed
      // For now, we handle it client-side for better dev experience
      return {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: file.url,
        uploadedBy: metadata.userId,
      };
    }),
  productLogo: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
      acl: "public-read",
    },
  })
    .middleware(async ({ req, files }) => {
      const headers = convertToHeaders(req.headers);
      const session = await auth.api.getSession({ headers });
      const user = session?.user;

      if (!user) throw new UploadThingError("Unauthorized");

      if (!acceptedImageTypes.includes(files[0]?.type ?? ""))
        throw new UploadThingError("Invalid file type");

      if (files?.length && files[0]?.size && files[0]?.size > 2 * 1024 * 1024)
        throw new UploadThingError("File size is larger than 2MB");

      if (files.length > 1) throw new UploadThingError("Only one file allowed");

      const fileName = `${user.id}-${user.name.split(" ").join("_").toLowerCase()}-${Date.now()}.${files[0]?.type?.split("/")[1]}`;
      return { userId: user.id, fileName };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("onUploadComplete called (production only)!");
      console.log("File URL:", file.url);

      return {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: file.url,
        uploadedBy: metadata.userId,
      };
    }),
  productGallery: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 10,
      acl: "public-read",
    },
  })
    .middleware(async ({ req, files }) => {
      const headers = convertToHeaders(req.headers);
      const session = await auth.api.getSession({ headers });
      const user = session?.user;

      if (!user) throw new UploadThingError("Unauthorized");

      if (!acceptedImageTypes.includes(files[0]?.type ?? ""))
        throw new UploadThingError("Invalid file type");

      if (files?.length && files[0]?.size && files[0]?.size > 2 * 1024 * 1024)
        throw new UploadThingError("File size is larger than 2MB");

      if (files.length > 10)
        throw new UploadThingError("Only 10 files allowed");

      const fileName = `${user.id}-${user.name.split(" ").join("_").toLowerCase()}-${Date.now()}.${files[0]?.type?.split("/")[1]}`;
      return { userId: user.id, fileName };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("onUploadComplete called (production only)!");
      console.log("File URL:", file.url);

      return {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: file.url,
        uploadedBy: metadata.userId,
      };
    }),
} satisfies FileRouter;

export const uploadRouteHandler = createRouteHandler({
  router: uploadRouter,
});

export type OurFileRouter = typeof uploadRouter;
