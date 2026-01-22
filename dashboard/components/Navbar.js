import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-blue-800 text-white p-4">
      <div className="container mx-auto flex gap-6">
        <Link href="/" className="hover:text-blue-200">
          Home
        </Link>
        <Link href="/Instructions" className="hover:text-blue-200">
          Instructions
        </Link>
        <Link href="/Record_Transactions" className="hover:text-blue-200">
          Record Transactions
        </Link>
        <Link href="/Dashboard" className="hover:text-blue-200">
          Dashboard
        </Link>
        <Link href="/Auditing" className="hover:text-blue-200">
          Auditing
        </Link>
        <Link href="/Reports_Seasonal" className="hover:text-blue-200">
          Reports
        </Link>
      </div>
    </nav>
  );
}