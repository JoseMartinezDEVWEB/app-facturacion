import { useState, useEffect } from 'react';
import { Card, Typography, Spin, Button, Input, List, Divider, Alert, message } from 'antd';
import { CopyOutlined, GlobalOutlined, LaptopOutlined, WarningOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';

const { Title, Text, Paragraph } = Typography;

const RemoteAccess = () => {
  const [remoteUrls, setRemoteUrls] = useState(null);
  const [localIPs, setLocalIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [frontendPort, setFrontendPort] = useState(8500);
  const [backendPort, setBackendPort] = useState(8501);

  useEffect(() => {
    // Verificar si estamos en un entorno Electron
    const isElectron = window.electronAPI !== undefined;
    
    if (isElectron) {
      // Obtener URLs de acceso remoto
      window.electronAPI.getRemoteUrls()
        .then((urls) => {
          setRemoteUrls(urls);
          // Verificar si el acceso remoto está habilitado según la respuesta
          setIsEnabled(urls && urls.enabled !== false);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error al obtener URLs remotas:', error);
          setIsEnabled(false);
          setLoading(false);
        });
      
      // Obtener direcciones IP locales
      window.electronAPI.getLocalIPs()
        .then((ips) => {
          setLocalIPs(ips);
        })
        .catch((error) => {
          console.error('Error al obtener IPs locales:', error);
        });
      
      // Suscribirse a actualizaciones de las URLs remotas
      const unsubscribe = window.electronAPI.onRemoteAccessUrls((urls) => {
        setRemoteUrls(urls);
        setIsEnabled(urls && urls.enabled !== false);
        setLoading(false);
      });
      
      // Obtener puertos de la ventana global o del entorno
      if (window.electronAPI.getFrontendPort) {
        window.electronAPI.getFrontendPort()
          .then(port => {
            if (port) setFrontendPort(port);
          })
          .catch(err => console.error('Error al obtener puerto frontend:', err));
      } else if (window.FRONTEND_PORT) {
        setFrontendPort(window.FRONTEND_PORT);
      }
      
      if (window.electronAPI.getBackendPort) {
        window.electronAPI.getBackendPort()
          .then(port => {
            if (port) setBackendPort(port);
          })
          .catch(err => console.error('Error al obtener puerto backend:', err));
      } else if (window.BACKEND_PORT) {
        setBackendPort(window.BACKEND_PORT);
      }
      
      // Limpiar suscripción al desmontar
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } else {
      // No estamos en Electron, mostrar mensaje apropiado
      setLoading(false);
      
      // Intentar obtener puertos desde variables de entorno o config
      try {
        if (import.meta && import.meta.env) {
          if (import.meta.env.VITE_PORT) {
            setFrontendPort(parseInt(import.meta.env.VITE_PORT));
          }
          if (import.meta.env.VITE_BACKEND_PORT) {
            setBackendPort(parseInt(import.meta.env.VITE_BACKEND_PORT));
          }
        }
      } catch (error) {
        console.error('Error al obtener puertos de variables de entorno:', error);
      }
    }
  }, []);

  // Función para copiar al portapapeles
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(type);
        toast.success('¡Copiado al portapapeles!');
        setTimeout(() => setCopied(''), 3000);
      })
      .catch(err => {
        console.error('Error al copiar:', err);
        toast.error('No se pudo copiar al portapapeles');
      });
  };

  // Si no estamos en Electron o si electronAPI no está disponible
  if (window.electronAPI === undefined) {
    return (
      <Card title="Acceso Remoto" style={{ margin: '20px 0' }}>
        <Alert
          message="Función disponible solo en la versión de escritorio"
          description="Esta característica está disponible exclusivamente en la aplicación de escritorio. Por favor, descarga la versión de escritorio para utilizar el acceso remoto."
          type="info"
          showIcon
        />
      </Card>
    );
  }

  // Mientras se carga
  if (loading) {
    return (
      <Card title="Acceso Remoto" style={{ margin: '20px 0', textAlign: 'center' }}>
        <Spin tip="Configurando acceso remoto..." />
      </Card>
    );
  }

  // Si el acceso remoto está desactivado en la configuración
  if (!isEnabled) {
    return (
      <Card title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <WarningOutlined style={{ marginRight: 8 }} />
          <span>Acceso Remoto Desactivado</span>
        </div>
      } style={{ margin: '20px 0' }}>
        <Alert
          message="Acceso remoto desactivado"
          description="El acceso remoto a través de Internet está desactivado en esta instalación. Puedes seguir usando la aplicación en modo local o activar el acceso remoto en la configuración."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Divider />
        
        <Title level={4} style={{ display: 'flex', alignItems: 'center' }}>
          <LaptopOutlined style={{ marginRight: 8 }} />
          <span>Acceso en red local</span>
        </Title>
        
        {localIPs.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={localIPs}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={`Interfaz: ${item.interface}`}
                  description={
                    <div>
                      <div>Dirección IP: {item.address}</div>
                      <div style={{ marginTop: 8 }}>
                        <Text copyable={{ text: `http://${item.address}:${frontendPort}` }}>
                          Acceso Frontend: http://{item.address}:{frontendPort}
                        </Text>
                      </div>
                      <div>
                        <Text copyable={{ text: `http://${item.address}:${backendPort}` }}>
                          Acceso Backend: http://{item.address}:{backendPort}
                        </Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Text>No se encontraron direcciones IP locales.</Text>
        )}
      </Card>
    );
  }

  return (
    <Card title={
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <GlobalOutlined style={{ marginRight: 8 }} />
        <span>Acceso Remoto a la Aplicación</span>
      </div>
    } style={{ margin: '20px 0' }}>
      {remoteUrls ? (
        <>
          <Alert
            message="Acceso remoto configurado correctamente"
            description="Tu aplicación ahora está disponible de forma remota a través de Internet. Comparte estos enlaces para permitir acceso desde otros dispositivos."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Title level={4}>Enlaces de acceso remoto</Title>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Aplicación Web:</Text>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
              <Input 
                readOnly 
                value={remoteUrls.frontend} 
                style={{ marginRight: 8 }}
              />
              <Button 
                icon={<CopyOutlined />} 
                onClick={() => copyToClipboard(remoteUrls.frontend, 'frontend')}
                type={copied === 'frontend' ? 'primary' : 'default'}
              >
                {copied === 'frontend' ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <Text strong>API Backend:</Text>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
              <Input 
                readOnly 
                value={remoteUrls.api} 
                style={{ marginRight: 8 }}
              />
              <Button 
                icon={<CopyOutlined />} 
                onClick={() => copyToClipboard(remoteUrls.api, 'api')}
                type={copied === 'api' ? 'primary' : 'default'}
              >
                {copied === 'api' ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>
          
          <Divider />
          
          <Title level={4} style={{ display: 'flex', alignItems: 'center' }}>
            <LaptopOutlined style={{ marginRight: 8 }} />
            <span>Acceso en red local</span>
          </Title>
          
          {localIPs.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={localIPs}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={`Interfaz: ${item.interface}`}
                    description={
                      <div>
                        <div>Dirección IP: {item.address}</div>
                        <div style={{ marginTop: 8 }}>
                          <Text copyable={{ text: `http://${item.address}:${frontendPort}` }}>
                            Acceso Frontend: http://{item.address}:{frontendPort}
                          </Text>
                        </div>
                        <div>
                          <Text copyable={{ text: `http://${item.address}:${backendPort}` }}>
                            Acceso Backend: http://{item.address}:{backendPort}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Text>No se encontraron direcciones IP locales.</Text>
          )}
          
          <Divider />
          
          <Alert
            message="Información de seguridad"
            description={
              <div>
                <Paragraph>
                  Los enlaces de acceso remoto son temporales y se regenerarán cada vez que inicie la aplicación.
                </Paragraph>
                <Paragraph>
                  Para mayor seguridad, asegúrate de tener activada la autenticación en tu aplicación y utilizar conexiones seguras si manejas información sensible.
                </Paragraph>
              </div>
            }
            type="warning"
            showIcon
          />
        </>
      ) : (
        <Alert
          message="No se pudo configurar el acceso remoto"
          description="Ha ocurrido un error al configurar el acceso remoto. Por favor, verifica tu conexión a Internet e inténtalo de nuevo reiniciando la aplicación."
          type="error"
          showIcon
        />
      )}
    </Card>
  );
};

export default RemoteAccess; 