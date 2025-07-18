import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documentTypes, type DocumentType } from "@shared/schema";
import { ListPlus } from "lucide-react";
import { 
  FileText, 
  Layers3, 
  Users, 
  Route, 
  Rocket, 
  Target, 
  Settings, 
  CheckCircle, 
  Code 
} from "lucide-react";

const iconMap = {
  "file-text": FileText,
  "layer-group": Layers3,
  "users": Users,
  "road": Route,
  "rocket": Rocket,
  "bullseye": Target,
  "cogs": Settings,
  "check-circle": CheckCircle,
  "code": Code,
};

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
  indigo: "bg-indigo-100 text-indigo-600",
  red: "bg-red-100 text-red-600",
  gray: "bg-gray-100 text-gray-600",
  yellow: "bg-yellow-100 text-yellow-600",
  teal: "bg-teal-100 text-teal-600",
};

interface DocumentTypeSelectorProps {
  selectedType: DocumentType | "";
  onTypeSelect: (type: DocumentType) => void;
}

export default function DocumentTypeSelector({ selectedType, onTypeSelect }: DocumentTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ListPlus className="text-primary mr-2" size={20} />
          Tipo de Documento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentTypes.map((type) => {
            const IconComponent = iconMap[type.icon as keyof typeof iconMap];
            const colorClass = colorMap[type.color as keyof typeof colorMap];
            const isSelected = selectedType === type.value;
            
            return (
              <div key={type.value} className="relative">
                <input
                  type="radio"
                  name="documentType"
                  value={type.value}
                  id={type.value}
                  checked={isSelected}
                  onChange={() => onTypeSelect(type.value)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={type.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-primary bg-blue-50' 
                      : 'border-gray-200 hover:border-primary'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${colorClass}`}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
