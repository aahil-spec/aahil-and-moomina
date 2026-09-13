export default function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-12">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center gap-2">
        <p className="font-semibold">Aahil and Moomina</p>
        <p className="text-sm text-muted-foreground">Watch. Talk. Stay close.</p>
        <p className="text-xs text-muted-foreground mt-4">
          &copy; {new Date().getFullYear()} Aahil and Moomina. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
