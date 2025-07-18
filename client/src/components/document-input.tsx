import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";

interface DocumentInputProps {
  demand: string;
  setDemand: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
}

export default function DocumentInput({ demand, setDemand, title, setTitle }: DocumentInputProps) {
  const characterCount = demand.length;
  const maxCharacters = 10000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Edit className="text-primary mr-2" size={20} />
          Inserir Demanda ou Documentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título do Documento
          </label>
          <Input
            placeholder="Ex: Login Social Mobile, Dashboard Analytics, etc."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição da Demanda
          </label>
          <Textarea
            placeholder="Descreva sua demanda ou cole documentos existentes aqui para refinamento...

Exemplo: 'Preciso criar uma funcionalidade de login social para o aplicativo móvel que permita aos usuários fazer login usando Google e Facebook, com autenticação segura e sincronização de dados do perfil.'"
            rows={8}
            value={demand}
            onChange={(e) => setDemand(e.target.value)}
            className="resize-none"
            maxLength={maxCharacters}
          />
          
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <span>{characterCount} caracteres</span>
            <span>Máximo: {maxCharacters.toLocaleString()} caracteres</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
