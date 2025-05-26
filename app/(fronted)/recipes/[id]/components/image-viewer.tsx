"use client";

import Image from "next/image";
import { useState } from "react";
import { X, ZoomIn, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

interface ImageViewerProps {
  imageUrl: string;
  alt: string;
}

export function ImageViewer({ imageUrl, alt }: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border/40 group cursor-pointer relative">
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
            <div className="bg-background/80 rounded-full p-2">
              <ZoomIn className="h-5 w-5 text-primary" />
            </div>
          </div>
          <Image
            src={imageUrl}
            alt={alt}
            width={500}
            height={300}
            className="object-contain w-full h-auto transition-transform group-hover:scale-105 duration-300"
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] max-h-[90vh] p-0 overflow-hidden rounded-lg mx-auto">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">放大查看图片</DialogDescription>
        <div className="relative h-full w-full">
          <DialogClose className="absolute right-2 top-2 z-50 bg-background/80 rounded-full p-1 hover:bg-background">
            <X className="h-5 w-5" />
          </DialogClose>
          <div className="h-full w-full flex items-center justify-center p-4">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <div className="min-h-[300px] w-full flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">加载中...</span>
                </div>
              </div>
            )}
            <Image
              src={imageUrl}
              alt={alt}
              width={1200}
              height={800}
              className="object-contain max-h-[80vh] w-auto h-auto"
              onLoadingComplete={() => setIsLoading(false)}
              onLoad={() => setIsLoading(false)}
              style={{ minHeight: isLoading ? '300px' : 'auto' }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 