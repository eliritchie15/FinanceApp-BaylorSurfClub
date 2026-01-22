import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto p-8">
        <p className="text-gray-700">
          Welcome to your finance app!
        </p>
      </main>
    </div>
  );
}