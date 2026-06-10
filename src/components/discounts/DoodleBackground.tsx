type DoodleKind =
  | "burgerMeal"
  | "toyTrain"
  | "boots"
  | "suit"
  | "backpack"
  | "hat"
  | "coffee"
  | "cocktail"
  | "beer"
  | "shoppingBag"
  | "sneaker"
  | "phones"
  | "speaker"
  | "dog"
  | "apple"
  | "airplane";

type Doodle = {
  kind: DoodleKind;
  className: string;
  rotate?: string;
  foreground?: boolean;
};

const doodles: Doodle[] = [
  { kind: "burgerMeal", className: "right-[6%] top-[59rem] h-44 w-44", rotate: "7deg" },
  { kind: "cocktail", className: "left-[49%] top-[50rem] h-32 w-32", rotate: "-7deg" },
  { kind: "phones", className: "left-[48%] top-[29rem] h-28 w-28", rotate: "5deg" },
  { kind: "apple", className: "left-[43%] top-[30rem] h-16 w-16", rotate: "-8deg" },
  { kind: "airplane", className: "left-[65%] top-[27rem] h-28 w-32", rotate: "-8deg" },
  { kind: "suit", className: "left-[38%] top-[36rem] h-32 w-32", rotate: "6deg" },
  { kind: "beer", className: "right-[32%] top-[35rem] h-28 w-28", rotate: "-4deg" },
  { kind: "dog", className: "right-[25%] top-[45rem] h-[7.5rem] w-[7.5rem]", rotate: "-3deg" },
  { kind: "speaker", className: "right-[6%] top-[49rem] h-28 w-28", rotate: "4deg" },
  { kind: "boots", className: "right-[25%] top-[60rem] h-28 w-40", rotate: "4deg" },
  { kind: "sneaker", className: "right-[4%] top-[40rem] h-24 w-44", rotate: "8deg" },
  { kind: "hat", className: "right-[20%] top-[40rem] h-24 w-28", rotate: "-5deg" },
  { kind: "backpack", className: "right-[4%] top-[27rem] h-32 w-32", rotate: "-5deg" },
  { kind: "coffee", className: "left-[43%] top-[58rem] h-24 w-24", rotate: "8deg" },
  { kind: "toyTrain", className: "left-[56%] top-[68rem] h-28 w-28", rotate: "-8deg" },
  { kind: "shoppingBag", className: "right-[31%] top-[90rem] h-28 w-28", rotate: "-6deg" },
];

const mobileDoodles: Doodle[] = [
  { kind: "burgerMeal", className: "-right-14 top-[28rem] h-28 w-28", rotate: "-7deg" },
  { kind: "cocktail", className: "-left-8 top-[34rem] h-20 w-20", rotate: "-6deg" },
  { kind: "phones", className: "-left-8 top-[40rem] h-20 w-20", rotate: "5deg" },
  { kind: "apple", className: "-left-3 top-[38rem] h-12 w-12", rotate: "-8deg" },
  { kind: "airplane", className: "-right-10 top-[35rem] h-20 w-24", rotate: "-9deg" },
  { kind: "coffee", className: "left-[39%] top-[43rem] h-16 w-16", rotate: "8deg", foreground: true },
  { kind: "suit", className: "-right-8 top-[48rem] h-20 w-20", rotate: "6deg" },
  { kind: "dog", className: "-left-8 top-[50rem] h-20 w-20", rotate: "-4deg" },
  { kind: "toyTrain", className: "left-[37%] top-[55rem] h-20 w-20", rotate: "-8deg", foreground: true },
  { kind: "speaker", className: "-right-8 top-[62rem] h-20 w-20", rotate: "4deg" },
  { kind: "boots", className: "-right-12 top-[56rem] h-[4.5rem] w-28", rotate: "4deg" },
  { kind: "beer", className: "-left-8 top-[66rem] h-20 w-20", rotate: "-4deg" },
  { kind: "sneaker", className: "-right-12 top-[70rem] h-16 w-28", rotate: "9deg" },
  { kind: "hat", className: "-left-8 top-[78rem] h-[4.5rem] w-24", rotate: "-5deg" },
  { kind: "backpack", className: "-right-9 top-[78rem] h-[5.5rem] w-[5.5rem]", rotate: "8deg" },
  { kind: "shoppingBag", className: "left-[36%] top-[88rem] h-20 w-20", rotate: "-6deg", foreground: true },
];

function DoodleSvg({ kind }: { kind: DoodleKind }) {
  const line = {
    stroke: "#3f2a17",
    strokeWidth: 4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "burgerMeal":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#e53935" d="M7 47h45l-5 76H19L7 47Z" />
          <path {...line} fill="#fbbf24" d="M14 44 8 18l13 24L22 9l11 31 6-27 7 28 9-21-3 28Z" />
          <path {...line} fill="#f59e0b" d="M55 69c7-31 71-29 78-1 2 8-1 15-8 18H64c-8-3-11-9-9-17Z" />
          <path {...line} fill="#16a34a" d="M57 84c10-7 16 6 27-1 10-7 17 6 28-1 9-6 13 4 22 0v15H57V84Z" />
          <path {...line} fill="#b91c1c" d="M62 96h68c2 12-7 21-33 21s-37-9-35-21Z" />
          <path {...line} fill="#f97316" d="M68 117h56l-14 10H82l-14-10Z" />
          <path {...line} fill="#f8c891" d="M60 126h70c-8 11-63 12-70 0Z" />
          <path {...line} d="M79 59h1M95 52h1M111 59h1M73 72c8-4 15-5 25-1M102 71c8-3 14-3 22 0" />
        </svg>
      );
    case "toyTrain":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#a7f3d0" d="M78 53h43v49H78Z" />
          <path {...line} fill="#facc15" d="M31 74c0-19 24-29 37-15v43H31Z" />
          <path {...line} fill="#ef4444" d="M92 67h18v17H92Z" />
          <path {...line} fill="#8b5cf6" d="M23 102h105v14H23Z" />
          <circle cx="46" cy="118" r="12" fill="#60a5fa" stroke="#3f2a17" strokeWidth="4" />
          <circle cx="105" cy="118" r="12" fill="#60a5fa" stroke="#3f2a17" strokeWidth="4" />
          <path {...line} d="M49 47c-9-25 27-26 21-1M43 77c6 5 13 5 19 0" />
        </svg>
      );
    case "boots":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#f8fafc" d="M21 30h31l4 43c4 11 16 15 35 16 13 1 22 7 24 16 2 7-4 11-15 11H39c-15 0-23-8-22-21l4-65Z" />
          <path {...line} fill="#fff" d="M61 42h34l4 36c3 9 14 13 30 14 10 1 17 6 17 14 0 7-6 11-17 11H78c-17 0-24-9-23-23l6-52Z" />
          <path {...line} d="M25 49h24M26 65h25M65 58h27M66 72h29M19 96c24 8 61 8 96 3M57 95c18 8 50 10 82 5M57 85c8 9 19 14 35 16" />
        </svg>
      );
    case "suit":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#1e3a8a" d="M24 29 47 14h46l23 15v91H24V29Z" />
          <path {...line} fill="#f8fafc" d="M47 14 70 45 93 14l-8 106H55L47 14Z" />
          <path {...line} fill="#dbeafe" d="M47 14 70 45 49 61 30 26Z" />
          <path {...line} fill="#dbeafe" d="M93 14 70 45l21 16 19-35Z" />
          <path {...line} fill="#dc2626" d="m70 45 11 23-11 28-11-28 11-23Z" />
          <path {...line} d="M51 83h-9M99 83h-9M70 96v24" />
        </svg>
      );
    case "backpack":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#8b5cf6" d="M26 48c0-25 19-39 44-39s44 14 44 39v72H26V48Z" />
          <path {...line} fill="#22d3ee" d="M34 72h72v48H34Z" />
          <path {...line} fill="#fde047" d="M51 23h39v33H51Z" />
          <path {...line} fill="#f97316" d="M57 55h26v15H57Z" />
          <path {...line} fill="#f8c891" d="M39 93h62v26H39Z" />
          <path {...line} fill="#ef4444" d="M70 98c11-18 33 0 0 19-33-19-11-37 0-19Z" />
          <path {...line} d="M26 55c-16 12-16 40 0 52M114 55c16 12 16 40 0 52M49 82h42" />
        </svg>
      );
    case "hat":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#fff" d="M31 78c2-25 16-45 38-45s37 19 39 45H31Z" />
          <path {...line} fill="#fef9c3" d="M17 84c24 11 75 11 105-1-9 21-87 25-105 1Z" />
          <path {...line} stroke="#facc15" d="M34 72c19 6 52 6 73 0" />
          <circle cx="99" cy="54" r="13" fill="#fde047" stroke="#3f2a17" strokeWidth="4" />
          <path {...line} fill="#fff" d="M99 34v40M79 54h40" />
        </svg>
      );
    case "coffee":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#67e8f9" d="M35 56h62v29c0 19-13 33-31 33S35 104 35 85V56Z" />
          <path {...line} d="M98 65h10c15 0 15 25 0 26H98M47 70h1M78 70h1M55 92c8 8 19 8 28 0M48 45c-6-12 10-13 4-25M71 45c-7-12 9-14 4-25" />
          <path {...line} fill="#e0f2fe" d="M25 119h85" />
        </svg>
      );
    case "cocktail":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#fbcfe8" d="M26 26h89L73 73 26 26Z" />
          <path {...line} d="M73 73v45M51 119h44M52 26l-15-17M76 27l23-19M91 50c12-1 17-8 22-18" />
          <path {...line} fill="#fde047" d="m101 8 5 10 12 1-9 8 3 12-11-6-10 6 2-12-9-8 12-1 5-10Z" />
        </svg>
      );
    case "beer":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#facc15" d="M34 42h57v68c0 12-8 20-20 20H54c-12 0-20-8-20-20V42Z" />
          <path {...line} fill="#fff" d="M30 42c1-22 15-15 27-22 9-5 17 5 27 3 14-3 23 5 19 20H30Z" />
          <path {...line} d="M91 58h15c18 0 18 39 0 39H91M50 58v50M66 58v50M82 58v50" />
        </svg>
      );
    case "shoppingBag":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#38bdf8" d="M26 35h71l9 87H19l7-87Z" />
          <path {...line} fill="#f9a8d4" d="M97 35h22l4 87h-17L97 35Z" />
          <path {...line} d="M46 35c0-19 30-19 30 0" />
          <path {...line} fill="#f472b6" d="M62 74c13-21 37 0 0 24-37-24-13-45 0-24Z" />
          <path {...line} d="M49 63h1M78 63h1M56 84c5 4 10 4 15 0" />
        </svg>
      );
    case "sneaker":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#fb923c" d="M10 76c25 3 49-15 68-42 9 24 28 35 48 38 11 2 15 8 12 18-2 8-9 12-20 12H16C4 102 1 82 10 76Z" />
          <path {...line} fill="#fff" d="M12 96h119c-1 15-17 22-62 22S4 110 12 96Z" />
          <path {...line} d="M23 76c23 13 62 15 101 5M63 61l18 9M74 48l21 16M50 70h27M92 61l11-10" />
        </svg>
      );
    case "phones":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <rect x="20" y="23" width="40" height="87" rx="9" fill="#bae6fd" stroke="#3f2a17" strokeWidth="4" />
          <rect x="74" y="23" width="45" height="87" rx="9" fill="#fce7f3" stroke="#3f2a17" strokeWidth="4" />
          <rect x="27" y="33" width="26" height="63" rx="5" fill="#f8fafc" stroke="#3f2a17" strokeWidth="3" />
          <rect x="82" y="33" width="29" height="63" rx="5" fill="#f8fafc" stroke="#3f2a17" strokeWidth="3" />
          <path {...line} d="M31 41c5 8 13 8 18 0M88 55h1M105 55h1M91 75c6 6 14 6 20 0M39 112h1M96 112h1" />
          <path {...line} fill="#fbcfe8" d="M101 36c6-11 20 0 0 12-20-12-6-23 0-12Z" />
          <path {...line} d="M62 38c6-8 11-9 16-4" />
        </svg>
      );
    case "apple":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#ef4444" d="M71 45c18-20 47-7 47 25 0 34-22 52-36 44-6-4-11-4-18 0-14 8-36-10-36-44 0-31 28-45 43-25Z" />
          <path {...line} fill="#bbf7d0" d="M73 39c4-19 17-28 35-25-2 18-16 28-35 25Z" />
          <path {...line} d="M70 42c-4-14 4-22 14-28M48 70c3-10 11-16 22-17M87 70h1" />
        </svg>
      );
    case "airplane":
      return (
        <svg viewBox="0 0 180 130" className="h-full w-full">
          <path {...line} fill="#dbeafe" d="M78 43 45 10c12-8 28-2 55 28 7 8-12 11-22 5Z" />
          <path {...line} fill="#f8fafc" d="M29 73c4-23 23-38 54-42 30-4 63 1 74 12 9 9 4 20-12 25-33 10-73 24-105 22-14-1-15-8-11-17Z" />
          <path {...line} fill="#ef4444" d="M50 82c27-14 73-24 103-33-2 9-9 16-23 22-25 10-54 20-79 22-13 1-20-2-23-7 7 0 14-1 22-4Z" />
          <path {...line} fill="#e0f2fe" d="M31 66c6-15 20-25 37-28 10 10 7 31-7 42-15 11-32 4-30-14Z" />
          <path {...line} fill="#f8fafc" d="M141 43l18-30c9 3 10 14 2 33Z" />
          <path {...line} fill="#ef4444" d="M149 41l12-22c5 5 4 14-1 27Z" />
          <path {...line} fill="#f8fafc" d="M150 49c18-2 29 2 27 10-9 5-22 4-36-1Z" />
          <path {...line} fill="#dbeafe" d="M83 77c22-9 51-10 76-4-11 13-45 21-83 21-11 0-13-10 7-17Z" />
          <circle cx="84" cy="96" r="12" fill="#e5e7eb" stroke="#3f2a17" strokeWidth="4" />
          <circle cx="84" cy="96" r="6" fill="#f8fafc" stroke="#3f2a17" strokeWidth="3" />
          <circle cx="126" cy="94" r="9" fill="#e5e7eb" stroke="#3f2a17" strokeWidth="4" />
          <circle cx="126" cy="94" r="4" fill="#f8fafc" stroke="#3f2a17" strokeWidth="3" />
          <path {...line} d="M47 65h1M58 61h1M72 56h1" />
          <ellipse cx="83" cy="51" rx="3" ry="6" fill="#dbeafe" stroke="#3f2a17" strokeWidth="3" />
          <ellipse cx="96" cy="49" rx="3" ry="5" fill="#dbeafe" stroke="#3f2a17" strokeWidth="3" />
          <ellipse cx="109" cy="47" rx="3" ry="5" fill="#dbeafe" stroke="#3f2a17" strokeWidth="3" />
          <ellipse cx="122" cy="47" rx="3" ry="5" fill="#dbeafe" stroke="#3f2a17" strokeWidth="3" />
          <ellipse cx="135" cy="48" rx="3" ry="5" fill="#dbeafe" stroke="#3f2a17" strokeWidth="3" />
          <path {...line} d="M35 88c-7 8-18 6-22-2M21 83c4 8 13 10 22 5" />
        </svg>
      );
    case "speaker":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <rect x="28" y="16" width="84" height="110" rx="7" fill="#f8fafc" stroke="#3f2a17" strokeWidth="4" />
          <path {...line} fill="#e5e7eb" d="M39 27h62v88H39V27Z" />
          <path {...line} d="M43 31h1M97 31h1M43 111h1M97 111h1" />
          <circle cx="70" cy="50" r="19" fill="#fff" stroke="#3f2a17" strokeWidth="4" />
          <circle cx="70" cy="50" r="8" fill="#dbeafe" stroke="#3f2a17" strokeWidth="4" />
          <circle cx="70" cy="89" r="29" fill="#fff" stroke="#3f2a17" strokeWidth="4" />
          <circle cx="70" cy="89" r="14" fill="#111827" stroke="#3f2a17" strokeWidth="4" />
          <path {...line} d="M45 58v21M50 58h-8M95 58v21M100 58h-8" />
        </svg>
      );
    case "dog":
      return (
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <path {...line} fill="#6b7280" d="M34 36c-23-10-30 7-18 29 9-2 20-6 28-13M96 36c24-11 32 7 19 30-10-2-21-7-29-14" />
          <path {...line} fill="#9ca3af" d="M31 62c0-30 69-30 69 0 17 13 18 45 1 60-17 15-55 15-72 0-17-15-15-47 2-60Z" />
          <path {...line} fill="#f5deb3" d="M38 75c8-16 45-18 55 0 10 8 4 26-13 27-7 10-24 10-31 0-17-1-23-19-11-27Z" />
          <path {...line} fill="#111827" d="M57 78c0 5-4 9-8 9s-8-4-8-9 4-9 8-9 8 4 8 9ZM90 78c0 5-4 9-8 9s-8-4-8-9 4-9 8-9 8 4 8 9Z" />
          <path {...line} fill="#111827" d="M60 91c3-5 13-5 16 0-2 6-13 7-16 0Z" />
          <path {...line} fill="#f8fafc" d="M49 117c-11 17-30 14-29-2 1-13 15-23 27-19M84 117c11 17 30 14 29-2-1-13-15-23-27-19" />
          <path {...line} d="M63 98c5 5 10 5 16 0M41 59c7-11 16-16 28-18M91 59c-7-11-16-16-28-18M38 110c14 7 39 7 55 0" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DoodleBackground() {
  return (
    <div
      aria-hidden="true"
      data-testid="doodle-background"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(254,243,199,0.62),transparent_24%),radial-gradient(circle_at_90%_18%,rgba(221,214,254,0.5),transparent_24%),radial-gradient(circle_at_55%_75%,rgba(220,252,231,0.48),transparent_28%)]" />
      {doodles.map((doodle) => (
        <div
          key={doodle.kind}
          className={`absolute hidden opacity-[0.34] sm:block ${doodle.className}`}
          style={{ transform: `rotate(${doodle.rotate || "0deg"})` }}
        >
          <DoodleSvg kind={doodle.kind} />
        </div>
      ))}
      {mobileDoodles.map((doodle) => (
        <div
          key={`mobile-${doodle.kind}`}
          className={`absolute sm:hidden ${
            doodle.foreground ? "z-20 opacity-[0.11]" : "opacity-[0.24]"
          } ${doodle.className}`}
          style={{ transform: `rotate(${doodle.rotate || "0deg"})` }}
        >
          <DoodleSvg kind={doodle.kind} />
        </div>
      ))}
    </div>
  );
}
