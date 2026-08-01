/**
 * A tiny assembly language, and a virtual machine that runs it.
 *
 * Eight instructions, four registers, labels and jumps — enough to be Turing
 * complete in practice, and small enough to learn in about ninety seconds. The
 * exhibit is: here is a puzzle, here is an instruction set, write a program
 * that produces the required output.
 *
 * Written as a proper two-stage pipeline (assemble, then execute) rather than
 * interpreting text line by line, because that's what makes real error
 * reporting possible: an unknown label is caught at assembly time with its
 * source line, not discovered halfway through a run.
 */

export type Reg = 'A' | 'B' | 'C' | 'D';
export const REGISTERS: Reg[] = ['A', 'B', 'C', 'D'];

export type Operand = { kind: 'reg'; reg: Reg } | { kind: 'imm'; value: number };

export type Op = 'MOV' | 'ADD' | 'SUB' | 'MUL' | 'JMP' | 'JNZ' | 'OUT' | 'HLT';

export type Instruction = {
  op: Op;
  /** Destination register for MOV/ADD/SUB/MUL. */
  dst?: Reg;
  src?: Operand;
  label?: string;
  /** 1-based source line, for error messages. */
  line: number;
};

export type Program = { instructions: Instruction[]; labels: Map<string, number> };

export class AsmError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.name = 'AsmError';
    this.line = line;
  }
}

const isReg = (t: string): t is Reg => (REGISTERS as string[]).includes(t);

const operand = (token: string, line: number): Operand => {
  const t = token.trim();
  if (isReg(t.toUpperCase())) return { kind: 'reg', reg: t.toUpperCase() as Reg };
  if (/^-?\d+$/.test(t)) return { kind: 'imm', value: Number(t) };
  throw new AsmError(`expected a register or number, got "${t}"`, line);
};

export const assemble = (source: string): Program => {
  const instructions: Instruction[] = [];
  const labels = new Map<string, number>();
  const rawLines = source.split('\n');

  rawLines.forEach((raw, i) => {
    const line = i + 1;
    // Comments run to end of line; ';' and '#' both work so neither habit trips.
    const text = raw.replace(/[;#].*$/, '').trim();
    if (!text) return;

    if (text.endsWith(':')) {
      const name = text.slice(0, -1).trim();
      if (!/^[A-Za-z_][\w]*$/.test(name)) throw new AsmError(`bad label "${name}"`, line);
      if (labels.has(name)) throw new AsmError(`duplicate label "${name}"`, line);
      // Points at the *next* instruction to be pushed.
      labels.set(name, instructions.length);
      return;
    }

    const [head, ...restParts] = text.split(/\s+/);
    const op = head.toUpperCase() as Op;
    const rest = restParts.join(' ');
    const args = rest ? rest.split(',').map((a) => a.trim()).filter(Boolean) : [];

    switch (op) {
      case 'MOV':
      case 'ADD':
      case 'SUB':
      case 'MUL': {
        if (args.length !== 2) throw new AsmError(`${op} needs two operands`, line);
        const dst = args[0].toUpperCase();
        if (!isReg(dst)) throw new AsmError(`${op} must write to a register, got "${args[0]}"`, line);
        instructions.push({ op, dst, src: operand(args[1], line), line });
        return;
      }
      case 'OUT': {
        if (args.length !== 1) throw new AsmError('OUT needs one operand', line);
        instructions.push({ op, src: operand(args[0], line), line });
        return;
      }
      case 'JMP': {
        if (args.length !== 1) throw new AsmError('JMP needs a label', line);
        instructions.push({ op, label: args[0], line });
        return;
      }
      case 'JNZ': {
        if (args.length !== 2) throw new AsmError('JNZ needs a value and a label', line);
        instructions.push({ op, src: operand(args[0], line), label: args[1], line });
        return;
      }
      case 'HLT': {
        instructions.push({ op, line });
        return;
      }
      default:
        throw new AsmError(`unknown instruction "${head}"`, line);
    }
  });

  // Labels resolve after the whole file is read, so forward jumps are legal.
  for (const ins of instructions) {
    if (ins.label && !labels.has(ins.label)) {
      throw new AsmError(`unknown label "${ins.label}"`, ins.line);
    }
  }

  return { instructions, labels };
};

export type RunResult = {
  output: number[];
  registers: Record<Reg, number>;
  steps: number;
  halted: boolean;
  error?: string;
  errorLine?: number;
};

export const MAX_STEPS = 20000;
const MAX_OUTPUT = 64;

export const run = (source: string, maxSteps = MAX_STEPS): RunResult => {
  const registers: Record<Reg, number> = { A: 0, B: 0, C: 0, D: 0 };
  const output: number[] = [];

  let program: Program;
  try {
    program = assemble(source);
  } catch (e) {
    const err = e as AsmError;
    return {
      output,
      registers,
      steps: 0,
      halted: false,
      error: err.message,
      errorLine: err.line,
    };
  }

  const value = (o: Operand) => (o.kind === 'imm' ? o.value : registers[o.reg]);

  let pc = 0;
  let steps = 0;

  while (pc >= 0 && pc < program.instructions.length) {
    if (steps++ >= maxSteps) {
      return {
        output,
        registers,
        steps,
        halted: false,
        // A step cap is the only defence against a loop with no exit, and the
        // message has to say so — "nothing happened" is not a bug report.
        error: `Still running after ${maxSteps} steps — is a loop missing its exit?`,
      };
    }

    const ins = program.instructions[pc];
    switch (ins.op) {
      case 'MOV':
        registers[ins.dst!] = value(ins.src!);
        break;
      case 'ADD':
        registers[ins.dst!] += value(ins.src!);
        break;
      case 'SUB':
        registers[ins.dst!] -= value(ins.src!);
        break;
      case 'MUL':
        registers[ins.dst!] *= value(ins.src!);
        break;
      case 'OUT':
        if (output.length >= MAX_OUTPUT) {
          return {
            output,
            registers,
            steps,
            halted: false,
            error: `More than ${MAX_OUTPUT} values printed — check the loop.`,
          };
        }
        output.push(value(ins.src!));
        break;
      case 'JMP':
        pc = program.labels.get(ins.label!)!;
        continue;
      case 'JNZ':
        if (value(ins.src!) !== 0) {
          pc = program.labels.get(ins.label!)!;
          continue;
        }
        break;
      case 'HLT':
        return { output, registers, steps, halted: true };
    }
    pc++;
  }

  // Falling off the end is a normal halt — requiring HLT would be pedantry.
  return { output, registers, steps, halted: true };
};

export type Puzzle = {
  id: string;
  title: string;
  brief: string;
  expected: number[];
  starter: string;
  /** Proves the puzzle is solvable with this instruction set. Tests only. */
  reference: string;
};

export const PUZZLES: Puzzle[] = [
  {
    id: 'count',
    title: 'Count to five',
    brief: 'Print 1 2 3 4 5.',
    expected: [1, 2, 3, 4, 5],
    starter: `; registers A B C D all start at 0
MOV A, 0
loop:
ADD A, 1
OUT A
; stop once A reaches 5
MOV B, A
SUB B, 5
JNZ B, loop
HLT`,
    reference: `MOV A, 0
loop:
ADD A, 1
OUT A
MOV B, A
SUB B, 5
JNZ B, loop
HLT`,
  },
  {
    id: 'countdown',
    title: 'Countdown',
    brief: 'Print 5 4 3 2 1, in that order.',
    expected: [5, 4, 3, 2, 1],
    starter: `MOV A, 5
; your loop here
HLT`,
    reference: `MOV A, 5
loop:
OUT A
SUB A, 1
JNZ A, loop
HLT`,
  },
  {
    id: 'threes',
    title: 'Three times table',
    brief: 'Print the first five multiples of three: 3 6 9 12 15.',
    expected: [3, 6, 9, 12, 15],
    starter: `MOV A, 0
MOV C, 0
; count five times, adding three each pass
HLT`,
    reference: `MOV A, 0
MOV C, 0
loop:
ADD A, 3
ADD C, 1
OUT A
MOV B, C
SUB B, 5
JNZ B, loop
HLT`,
  },
  {
    id: 'squares',
    title: 'Squares',
    brief: 'Print the first five square numbers: 1 4 9 16 25.',
    expected: [1, 4, 9, 16, 25],
    starter: `MOV A, 0
MOV D, 5
; MUL multiplies a register in place
HLT`,
    reference: `MOV A, 0
MOV D, 5
sq:
ADD A, 1
MOV B, A
MUL B, A
OUT B
SUB D, 1
JNZ D, sq
HLT`,
  },
  {
    id: 'fib',
    title: 'Fibonacci',
    brief: 'Print the first eight Fibonacci numbers, starting 1 1.',
    expected: [1, 1, 2, 3, 5, 8, 13, 21],
    starter: `MOV A, 1
MOV B, 1
MOV D, 8
; you'll need C as scratch space
HLT`,
    reference: `MOV A, 1
MOV B, 1
MOV D, 8
fib:
OUT A
MOV C, A
ADD C, B
MOV A, B
MOV B, C
SUB D, 1
JNZ D, fib
HLT`,
  },
];

export const INSTRUCTION_HELP: Array<{ syntax: string; describe: string }> = [
  { syntax: 'MOV dst, src', describe: 'Copy a number or register into dst.' },
  { syntax: 'ADD dst, src', describe: 'dst = dst + src' },
  { syntax: 'SUB dst, src', describe: 'dst = dst − src' },
  { syntax: 'MUL dst, src', describe: 'dst = dst × src' },
  { syntax: 'JMP label', describe: 'Jump unconditionally.' },
  { syntax: 'JNZ src, label', describe: 'Jump if src is not zero.' },
  { syntax: 'OUT src', describe: 'Print a value.' },
  { syntax: 'HLT', describe: 'Stop. Falling off the end also stops.' },
  { syntax: 'name:', describe: 'A label. Jump targets can be defined later.' },
  { syntax: '; comment', describe: '; or # to end of line.' },
];
