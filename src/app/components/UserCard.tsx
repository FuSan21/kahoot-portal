"use client";

import { useState } from "react";
import { logout } from "@/app/auth/logout/actions";

export default function UserCard({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-48">
      <div
        className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.user_metadata.avatar_url || "/default-avatar.png"}
          alt="User avatar"
          width={32}
          height={32}
          className="rounded-full"
        />
        <span className="truncate flex-grow">{user.user_metadata.name}</span>
      </div>
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-md shadow-lg py-1">
          <div className="px-4 py-2 text-sm text-gray-700">
            <p className="font-semibold">{user.user_metadata.name}</p>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
