export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-sunset-500/10 px-4 py-3 text-sm text-sunset-600">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p role="status" className="rounded-xl bg-sea-500/10 px-4 py-3 text-sm text-sea-600">
        {message}
      </p>
    );
  }
  return null;
}
