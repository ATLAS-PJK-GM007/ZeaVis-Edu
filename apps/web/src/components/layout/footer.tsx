export function Footer() {
  return (
    <footer className="h-18 shrink-0 border-t bg-[#ECF4E8] flex items-center justify-center">
      <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} ATLAS Project - Pijak in collaboration with IBM SkillsBuild.
      </div>
    </footer>
  );
}