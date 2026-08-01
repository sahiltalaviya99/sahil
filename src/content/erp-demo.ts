/**
 * Dummy data for the sanitised ERP demo.
 *
 * EVERY value here is invented. No client data, no real patients, no real
 * orders — the names are deliberately obvious placeholders and the demo UI
 * labels itself as sample data in two places. The ERPs themselves are internal
 * systems and nothing from them appears here.
 *
 * The point is to show the *shape* of what was built (module structure, record
 * layouts, the flows), not to leak anything.
 */

export type DemoModule = {
  id: string;
  label: string;
  icon: string;
};

export type DemoKpi = { label: string; value: string; delta?: string; up?: boolean };
export type DemoRow = Record<string, string>;

export type ErpDemo = {
  /** Matches Project.id in content/projects.ts */
  projectId: string;
  name: string;
  industry: string;
  modules: DemoModule[];
  kpis: DemoKpi[];
  table: {
    title: string;
    columns: { key: string; label: string; align?: 'left' | 'right' }[];
    rows: DemoRow[];
  };
  /** Right-hand panel — a queue, schedule or feed depending on the domain. */
  panel: { title: string; items: { primary: string; secondary: string; tag: string }[] };
};

export const erpDemos: ErpDemo[] = [
  {
    projectId: 'adorn-hospital-erp',
    name: 'Hospital Management',
    industry: 'Healthcare · 2 branches · 10-bed IPD',
    modules: [
      { id: 'dashboard', label: 'Dashboard', icon: 'gauge' },
      { id: 'appointments', label: 'Appointments', icon: 'calendar' },
      { id: 'patients', label: 'Patients', icon: 'users' },
      { id: 'ipd', label: 'IPD & Beds', icon: 'bed' },
      { id: 'billing', label: 'Billing', icon: 'receipt' },
      { id: 'reports', label: 'Reports', icon: 'chart' },
    ],
    kpis: [
      { label: 'Appointments today', value: '34', delta: '+12%', up: true },
      { label: 'Beds occupied', value: '7 / 10' },
      { label: 'Awaiting consult', value: '5' },
      { label: 'Billed today', value: '₹1,84,500', delta: '+8%', up: true },
    ],
    table: {
      title: "Today's appointments",
      columns: [
        { key: 'time', label: 'Time' },
        { key: 'patient', label: 'Patient' },
        { key: 'doctor', label: 'Consultant' },
        { key: 'branch', label: 'Branch' },
        { key: 'status', label: 'Status' },
      ],
      rows: [
        { time: '09:30', patient: 'Patient A-1042', doctor: 'Dr. Sample', branch: 'Branch 1', status: 'Checked in' },
        { time: '10:15', patient: 'Patient A-1043', doctor: 'Dr. Example', branch: 'Branch 1', status: 'In consult' },
        { time: '11:00', patient: 'Patient A-1044', doctor: 'Dr. Sample', branch: 'Branch 2', status: 'Scheduled' },
        { time: '11:45', patient: 'Patient A-1045', doctor: 'Dr. Demo', branch: 'Branch 1', status: 'Scheduled' },
        { time: '14:00', patient: 'Patient A-1046', doctor: 'Dr. Example', branch: 'Branch 2', status: 'Scheduled' },
      ],
    },
    panel: {
      title: 'Inpatient ward',
      items: [
        { primary: 'Bed 03', secondary: 'Post-op · day 2', tag: 'Stable' },
        { primary: 'Bed 05', secondary: 'Observation', tag: 'Review' },
        { primary: 'Bed 07', secondary: 'Discharge pending', tag: 'Billing' },
        { primary: 'Bed 09', secondary: 'Admitted 08:20', tag: 'New' },
      ],
    },
  },
  {
    projectId: 'sahaj-cooling-erp',
    name: 'HVAC Operations',
    industry: 'HVAC & refrigeration · full operational surface',
    modules: [
      { id: 'dashboard', label: 'Dashboard', icon: 'gauge' },
      { id: 'quotations', label: 'Quotations', icon: 'file' },
      { id: 'inventory', label: 'Inventory', icon: 'box' },
      { id: 'service', label: 'Service & AMC', icon: 'wrench' },
      { id: 'dispatch', label: 'Dispatch', icon: 'truck' },
      { id: 'invoicing', label: 'Invoicing', icon: 'receipt' },
    ],
    kpis: [
      { label: 'Open quotations', value: '18', delta: '+3', up: true },
      { label: 'AMC due this month', value: '26' },
      { label: 'Stock alerts', value: '4', delta: '-2', up: false },
      { label: 'Invoiced MTD', value: '₹42,60,000', delta: '+15%', up: true },
    ],
    table: {
      title: 'Active service jobs',
      columns: [
        { key: 'job', label: 'Job' },
        { key: 'client', label: 'Client' },
        { key: 'type', label: 'Type' },
        { key: 'engineer', label: 'Engineer' },
        { key: 'status', label: 'Status' },
      ],
      rows: [
        { job: 'JOB-2211', client: 'Sample Industries', type: 'AMC visit', engineer: 'Team A', status: 'In progress' },
        { job: 'JOB-2212', client: 'Example Retail', type: 'Breakdown', engineer: 'Team B', status: 'Dispatched' },
        { job: 'JOB-2213', client: 'Demo Hospital', type: 'Installation', engineer: 'Team A', status: 'Scheduled' },
        { job: 'JOB-2214', client: 'Placeholder Motors', type: 'AMC visit', engineer: 'Team C', status: 'Scheduled' },
        { job: 'JOB-2215', client: 'Sample Mall', type: 'Breakdown', engineer: 'Team B', status: 'Closed' },
      ],
    },
    panel: {
      title: 'Low stock',
      items: [
        { primary: 'Compressor 2T', secondary: '3 remaining · reorder 10', tag: 'Low' },
        { primary: 'Copper pipe 1/2"', secondary: '48 m · reorder 200 m', tag: 'Low' },
        { primary: 'R32 refrigerant', secondary: '6 cyl · reorder 20', tag: 'Critical' },
        { primary: 'Filter drier', secondary: '12 · reorder 50', tag: 'Low' },
      ],
    },
  },
  {
    projectId: 'awax-manufacturing-erp',
    name: 'Manufacturing',
    industry: 'Candle manufacturing · retail, wholesale, custom',
    modules: [
      { id: 'dashboard', label: 'Dashboard', icon: 'gauge' },
      { id: 'production', label: 'Production', icon: 'factory' },
      { id: 'bom', label: 'BOM & Recipes', icon: 'layers' },
      { id: 'inventory', label: 'Raw material', icon: 'box' },
      { id: 'orders', label: 'Orders', icon: 'cart' },
      { id: 'dispatch', label: 'Dispatch', icon: 'truck' },
    ],
    kpis: [
      { label: 'Batches in production', value: '6' },
      { label: 'Units today', value: '2,480', delta: '+9%', up: true },
      { label: 'Open orders', value: '31', delta: '+5', up: true },
      { label: 'Wax stock', value: '740 kg', delta: '-120 kg', up: false },
    ],
    table: {
      title: 'Production batches',
      columns: [
        { key: 'batch', label: 'Batch' },
        { key: 'product', label: 'Product' },
        { key: 'channel', label: 'Channel' },
        { key: 'qty', label: 'Qty', align: 'right' },
        { key: 'status', label: 'Status' },
      ],
      rows: [
        { batch: 'B-8801', product: 'Soy jar 200g', channel: 'Retail', qty: '600', status: 'Pouring' },
        { batch: 'B-8802', product: 'Pillar candle', channel: 'Wholesale', qty: '1,200', status: 'Curing' },
        { batch: 'B-8803', product: 'Custom hamper', channel: 'Custom', qty: '150', status: 'Packing' },
        { batch: 'B-8804', product: 'Tealight x50', channel: 'Wholesale', qty: '400', status: 'Queued' },
        { batch: 'B-8805', product: 'Reed diffuser', channel: 'Retail', qty: '130', status: 'QC' },
      ],
    },
    panel: {
      title: 'Custom order queue',
      items: [
        { primary: 'ORD-4417', secondary: 'Corporate gifting · 500 units', tag: 'Quoted' },
        { primary: 'ORD-4418', secondary: 'Wedding favours · 220 units', tag: 'Approved' },
        { primary: 'ORD-4419', secondary: 'Hotel amenity · 1,000 units', tag: 'In production' },
        { primary: 'ORD-4420', secondary: 'Private label · 300 units', tag: 'Draft' },
      ],
    },
  },
];

export const demoFor = (projectId: string) => erpDemos.find((d) => d.projectId === projectId);
