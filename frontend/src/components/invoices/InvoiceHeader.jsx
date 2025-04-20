import { useBusiness } from '../../context/BusinessContext';

const InvoiceHeader = () => {
  const { businessInfo, loading } = useBusiness();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-20 w-full rounded-md"></div>;
  }

  if (!businessInfo) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
        <p className="text-yellow-700">
          No se ha configurado la información del negocio. 
          <a href="/dashboard/configuracion" className="font-medium underline ml-1">
            Configurar ahora
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 p-4 border-b pb-6">
      <div className="flex items-center mb-4 md:mb-0">
        {businessInfo.logo && (
          <img 
            src={businessInfo.logo} 
            alt={`Logo de ${businessInfo.name}`} 
            className="w-16 h-16 object-contain mr-4"
          />
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-800">{businessInfo.name}</h2>
          <p className="text-sm text-gray-600">RNC: {businessInfo.taxId}</p>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>{businessInfo.address}</p>
        <p>Tel: {businessInfo.phone}</p>
        <p>{businessInfo.email}</p>
        {businessInfo.website && <p>{businessInfo.website}</p>}
      </div>
    </div>
  );
};

export default InvoiceHeader; 