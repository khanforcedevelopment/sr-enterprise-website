import { Building2, ClipboardList, Shapes } from 'lucide-react'

// The three licensed activities. Only these are advertised on the website.
export const SERVICES = [
  {
    id: 'facilities-planning',
    title: 'Facilities Resources Planning Consultancy',
    shortTitle: 'Facilities Resources Planning',
    icon: Building2,
    image: {
      src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=70',
      alt: 'Modern, well-planned office floor with workstations and natural light',
    },
    description:
      'Structured consultancy that helps organisations understand the space, equipment and operational resources their facilities need, and plan them in a practical, cost-aware way.',
    features: [
      'Facilities resource planning',
      'Operational resource assessment',
      'Facility requirements planning',
      'Resource allocation consultancy',
      'Business facilities planning support',
    ],
  },
  {
    id: 'project-management',
    title: 'Project Management Services',
    shortTitle: 'Project Management',
    icon: ClipboardList,
    image: {
      src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=70',
      alt: 'Project planning documents, charts and a laptop on a desk',
    },
    description:
      'Organised project management support from planning through to reporting, keeping scope, timelines and stakeholders aligned so projects move forward with clarity.',
    features: [
      'Project planning',
      'Project scheduling',
      'Project coordination',
      'Project documentation',
      'Progress monitoring',
      'Project management consultancy and reporting',
    ],
  },
  {
    id: 'model-supplies',
    title: 'Building Maquettes & Models Requisites Trading',
    shortTitle: 'Architectural Model Supplies',
    icon: Shapes,
    image: {
      src: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=70',
      alt: 'Architect working on building plans and presentation materials',
    },
    description:
      'Supply of materials and accessories used to build and present architectural maquettes and building models, for architects, designers, developers and students.',
    features: [
      'Architectural model-making supplies',
      'Building model accessories',
      'Model display materials',
      'Architectural presentation materials',
      'Model construction requisites',
    ],
  },
]

export const SERVICE_OPTIONS = SERVICES.map((s) => s.title)
