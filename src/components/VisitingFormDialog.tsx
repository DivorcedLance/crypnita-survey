"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VisitingFromDialog({ data }: { data: any[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Ver tabla: ¿De dónde nos están visitando?</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿De dónde nos están visitando?</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-700">
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Lugar
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right">
                  Porcentaje
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Visual
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-600">
                  <td className="border border-gray-300 px-4 py-2">
                    {item.text}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {item.percentage.toFixed(2)}%
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div
                      className="h-4 bg-blue-500"
                      style={{ width: `${item.percentage}%` }}
                      title={`${item.percentage.toFixed(2)}%`}
                    ></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
