export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Log In</h1>
        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-4 w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Log In
        </button>
      </form>
    </main>
  );
}
