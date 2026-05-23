"use client";
import { ReactNode } from "react";

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-3 rounded ${i === lines - 1 ? "w-3/4" : "w-full"}`}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
      <div className="flex gap-2 pt-1">
        <div className="skeleton h-6 w-16 rounded-full" style={{ animationDelay: `${lines * 100}ms` }} />
        <div className="skeleton h-6 w-12 rounded-full" style={{ animationDelay: `${(lines + 1) * 100}ms` }} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={3 + (i % 2)} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-3 space-y-2.5">
          <div className="skeleton w-full aspect-square rounded-lg" style={{ animationDelay: `${i * 80}ms` }} />
          <div className="skeleton h-3.5 w-3/4 rounded" style={{ animationDelay: `${(i * 80) + 50}ms` }} />
          <div className="skeleton h-3 w-1/2 rounded" style={{ animationDelay: `${(i * 80) + 100}ms` }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="skeleton w-20 h-20 rounded-full" />
      <div className="skeleton h-4 w-28 rounded" style={{ animationDelay: "100ms" }} />
      <div className="skeleton h-3 w-20 rounded" style={{ animationDelay: "200ms" }} />
    </div>
  );
}
