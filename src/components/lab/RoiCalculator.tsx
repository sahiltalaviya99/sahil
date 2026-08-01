import { useMemo, useState } from 'react';
import { ArrowRight, Clock, IndianRupee, TrendingUp } from 'lucide-react';

import CountUp from '@/components/reactbits/CountUp';
import { site } from '@/content/site';
import { cn } from '@/lib/utils';

/**
 * What automating a recurring task is actually worth.
 *
 * The arithmetic is deliberately transparent and the automation-rate is a
 * user-controlled slider rather than a flattering constant baked in — an ROI
 * widget that hides its assumptions is a sales trick, and this needs to survive
 * someone checking the maths.
 */

const PRESETS = [
  { label: 'Invoice generation', hours: 6, people: 2, rate: 450 },
  { label: 'HR document prep', hours: 4, people: 1, rate: 400 },
  { label: 'Report compilation', hours: 8, people: 3, rate: 500 },
  { label: 'Order data entry', hours: 12, people: 2, rate: 350 },
];

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));

const Field = ({
  label,
  suffix,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) => (
  <div>
    <div className="flex items-baseline justify-between gap-4">
      <label className="text-sm text-foreground">{label}</label>
      <span className="font-mono text-sm text-primary">
        {value}
        <span className="ml-1 text-[0.65rem] text-muted-foreground">{suffix}</span>
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={label}
      className="mt-2.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
    />
  </div>
);

export const RoiCalculator = () => {
  const [hours, setHours] = useState(6);
  const [people, setPeople] = useState(2);
  const [rate, setRate] = useState(450);
  const [automation, setAutomation] = useState(85);
  const [preset, setPreset] = useState(PRESETS[0].label);

  const result = useMemo(() => {
    const weeklyHours = hours * people;
    const savedWeekly = weeklyHours * (automation / 100);
    const savedYearly = savedWeekly * 52;
    const costYearly = savedYearly * rate;
    // A working week reclaimed, expressed in 40h weeks.
    const weeksReclaimed = savedYearly / 40;
    return { weeklyHours, savedWeekly, savedYearly, costYearly, weeksReclaimed };
  }, [hours, people, rate, automation]);

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setPreset(p.label);
    setHours(p.hours);
    setPeople(p.people);
    setRate(p.rate);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      {/* ---------------- Inputs ---------------- */}
      <div className="surface min-w-0 p-5 sm:p-6">
        <p className="mb-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
          your situation
        </p>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors',
                preset === p.label
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/25 hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <Field
            label="Hours per person, per week"
            suffix="hrs"
            value={hours}
            min={1}
            max={40}
            onChange={setHours}
          />
          <Field
            label="People doing it"
            suffix="people"
            value={people}
            min={1}
            max={20}
            onChange={setPeople}
          />
          <Field
            label="Loaded hourly cost"
            suffix="₹/hr"
            value={rate}
            min={100}
            max={3000}
            step={50}
            onChange={setRate}
          />
          <Field
            label="Share of the task that automates"
            suffix="%"
            value={automation}
            min={30}
            max={100}
            step={5}
            onChange={setAutomation}
          />
        </div>

        <p className="mt-6 border-t border-border pt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
          The automation share is yours to set, not a flattering number baked in. In practice
          document generation, data entry and reporting land at the high end; anything needing
          judgement lands lower.
        </p>
      </div>

      {/* ---------------- Output ---------------- */}
      <div className="min-w-0 space-y-4">
        <div className="surface relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-dots opacity-25" aria-hidden />

          <div className="relative">
            <p className="mb-5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
              what automating it returns
            </p>

            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs">Hours reclaimed per year</span>
                </div>
                <p className="mt-1 font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                  {/* key forces CountUp to re-run when inputs change */}
                  <CountUp key={result.savedYearly} to={Math.round(result.savedYearly)} duration={1} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ≈ {Math.round(result.weeksReclaimed)} full working weeks
                </p>
              </div>

              <div className="h-px w-full bg-border" />

              <div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IndianRupee className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs">Cost avoided per year</span>
                </div>
                <p className="mt-1 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  ₹{inr(result.costYearly)}
                </p>
              </div>

              <div className="h-px w-full bg-border" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground/70">
                    Before
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold">
                    {result.weeklyHours} hrs/wk
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground/70">
                    After
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-display text-lg font-semibold text-primary">
                    <TrendingUp className="h-4 w-4" />
                    {Math.round(result.weeklyHours - result.savedWeekly)} hrs/wk
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a href={`mailto:${site.email}?subject=Automation%20enquiry`} className="btn-primary w-full">
          Talk about automating this
          <ArrowRight className="h-4 w-4" />
        </a>

        <p className="text-center text-[0.7rem] text-muted-foreground">
          Straight arithmetic:{' '}
          <span className="font-mono text-foreground/70">
            hours × people × 52 × automation% × rate
          </span>
        </p>
      </div>
    </div>
  );
};
