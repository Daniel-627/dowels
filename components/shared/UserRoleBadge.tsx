const roleStyles: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  LANDLORD: "bg-blue-100 text-blue-700",
  TENANT: "bg-gray-100 text-gray-600",
};

export default function UserRoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleStyles[role] ?? "bg-gray-100 text-gray-600"}`}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}