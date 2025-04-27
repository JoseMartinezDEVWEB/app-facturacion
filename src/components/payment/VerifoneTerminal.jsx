import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, Row, Col, Card, Form, Input, 
  Alert, Spin, Badge, Modal, Table, Tabs,
  Typography, Space, Divider, Tag, Tooltip,
  message, Progress, Select, Empty, List, Result, Descriptions
} from 'antd';
import { 
  ShoppingCartOutlined, 
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  UsbOutlined,
  WifiOutlined,
  ApiOutlined,
  BarcodeOutlined,
  SearchOutlined,
  LinkOutlined,
  DisconnectOutlined,
  BulbOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  MobileOutlined,
  AppstoreOutlined,
  PlusOutlined,
  HomeOutlined,
  DesktopOutlined,
  GlobalOutlined,
  RobotOutlined,
  SafetyOutlined,
  DollarOutlined,
  SlackOutlined,
  BluetoothOutlined
} from '@ant-design/icons';
import verifoneService, { 
  TRANSACTION_STATUS, 
  CONNECTION_TYPES,
  DEVICE_TYPES
} from '../../services/verifoneService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

/**
 * Componente para procesar pagos con terminal Verifone
 * Permite detectar dispositivos, conectarse y procesar transacciones
 */
const VerifoneTerminal = ({ 
  amount = 0, 
  onComplete, 
  onCancel,
  reference = ''
}) => {
  // Estados para manejo del terminal
  const [status, setStatus] = useState(TRANSACTION_STATUS.READY);
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountInput, setAmountInput] = useState(amount.toString());
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [browserSupportInfo, setBrowserSupportInfo] = useState({
    usb: false,
    bluetooth: false
  });
  const [activeTab, setActiveTab] = useState('devices');
  const [networkConfig, setNetworkConfig] = useState({
    ipAddress: '',
    port: '5000',
    deviceType: DEVICE_TYPES.P400
  });
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionProgressText, setConnectionProgressText] = useState('');
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  
  // Referencia al intervalo de progreso
  const progressInterval = React.useRef(null);

  // Efecto para inicializar el servicio
  useEffect(() => {
    // Registrar callbacks
    verifoneService.registerCallbacks({
      onStatusChange: (newStatus) => {
        console.log('Verifone status changed:', newStatus);
        setStatus(newStatus);
        
        // Actualizar estados según el cambio de status
        if (newStatus === TRANSACTION_STATUS.CONNECTING) {
          startConnectionProgress();
        } else if (newStatus === TRANSACTION_STATUS.CONNECTED) {
          clearConnectionProgress(true);
          setIsConnected(true);
          setShowDeviceModal(false);
          message.success('Dispositivo conectado correctamente');
        } else if (newStatus === TRANSACTION_STATUS.READY) {
          setIsProcessing(false);
          clearConnectionProgress();
        } else if (newStatus === TRANSACTION_STATUS.COMPLETED) {
          setIsProcessing(false);
        } else if (newStatus === TRANSACTION_STATUS.CANCELLED) {
          setIsProcessing(false);
        } else if (newStatus === TRANSACTION_STATUS.ERROR) {
          clearConnectionProgress(false);
          setIsProcessing(false);
        } else if (
          newStatus === TRANSACTION_STATUS.PROCESSING || 
          newStatus === TRANSACTION_STATUS.WAITING_CARD ||
          newStatus === TRANSACTION_STATUS.CARD_READ ||
          newStatus === TRANSACTION_STATUS.AUTHORIZING
        ) {
          setIsProcessing(true);
        }
      },
      onSuccess: (transactionResult) => {
        console.log('Transaction successful:', transactionResult);
        setTransaction(transactionResult);
        
        // Llamar al callback de completado
        if (onComplete) {
          onComplete({
            paymentMethod: 'verifone_terminal',
            transactionId: transactionResult.transactionId,
            authCode: transactionResult.authCode,
            cardType: transactionResult.cardType,
            last4: transactionResult.last4,
            amount: transactionResult.amount || amount,
            deviceType: selectedDevice?.deviceType || 'unknown',
            deviceId: selectedDevice?.id || 'unknown',
            referenceId: reference || transactionResult.reference,
            status: 'approved'
          });
        }
      },
      onError: (errorMessage) => {
        console.error('Verifone error:', errorMessage);
        setError(errorMessage);
        setIsProcessing(false);
      },
      onDeviceDetected: (detectedDevices) => {
        console.log('Verifone devices detected:', detectedDevices);
        setDevices(detectedDevices);
        setIsDetecting(false);
        
        // Si solo tenemos el dispositivo de simulación y no hay soporte hardware,
        // seleccionarlo automáticamente
        if (
          detectedDevices.length === 1 && 
          detectedDevices[0].type === CONNECTION_TYPES.SIMULATION &&
          (!browserSupportInfo.usb && !browserSupportInfo.bluetooth)
        ) {
          setSelectedDevice(detectedDevices[0]);
        }
      }
    });
    
    // Verificar soporte del navegador
    const usbSupport = !!navigator.usb;
    const bluetoothSupport = !!navigator.bluetooth;
    
    setBrowserSupportInfo({
      usb: usbSupport,
      bluetooth: bluetoothSupport
    });
    
    // Buscar dispositivos inicialmente
    findDevices();
    
    return () => {
      // Limpiar recursos si es necesario
      if (isConnected) {
        verifoneService.disconnectDevice()
          .catch(err => console.error('Error disconnecting device on cleanup:', err));
      }
      
      // Limpiar intervalo de progreso si está activo
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [amount, onComplete, reference]);
  
  // Función para iniciar el progreso de conexión
  const startConnectionProgress = () => {
    setConnectionProgress(0);
    setConnectionProgressText('Conectando con el dispositivo...');
    setShowConnectionStatus(true);
    
    // Limpiar intervalo previo si existe
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    // Crear nuevo intervalo para actualizar el progreso
    progressInterval.current = setInterval(() => {
      setConnectionProgress(prev => {
        const newValue = prev + Math.floor(Math.random() * 5) + 1;
        
        // Actualizar texto según progreso
        if (newValue > 80) {
          setConnectionProgressText('Estableciendo comunicación...');
        } else if (newValue > 60) {
          setConnectionProgressText('Inicializando servicios...');
        } else if (newValue > 40) {
          setConnectionProgressText('Configurando dispositivo...');
        } else if (newValue > 20) {
          setConnectionProgressText('Abriendo conexión...');
        }
        
        // Limitar a 95% para esperar la confirmación real
        return Math.min(newValue, 95);
      });
    }, 200);
  };
  
  // Función para limpiar el progreso de conexión
  const clearConnectionProgress = (success = false) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    if (success) {
      // Si fue exitoso, mostrar 100%
      setConnectionProgress(100);
      setConnectionProgressText('Conexión establecida');
      
      // Ocultar después de un tiempo
      setTimeout(() => {
        setShowConnectionStatus(false);
      }, 1500);
    } else {
      // Si falló, ocultar inmediatamente
      setShowConnectionStatus(false);
    }
  };
  
  // Función para buscar dispositivos
  const findDevices = useCallback(async () => {
    setIsDetecting(true);
    setError(null);
    
    try {
      await verifoneService.findConnectedDevices();
    } catch (err) {
      setError(`Error al buscar dispositivos: ${err.message}`);
      setIsDetecting(false);
    }
  }, []);
  
  // Función para solicitar dispositivos USB
  const requestUsbDevices = useCallback(async () => {
    setIsDetecting(true);
    setError(null);
    
    try {
      await verifoneService.requestUsbDevices();
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        setError(`Error al solicitar dispositivos USB: ${err.message}`);
      }
      setIsDetecting(false);
    }
  }, []);
  
  // Función para solicitar dispositivos Bluetooth
  const requestBluetoothDevices = useCallback(async () => {
    setIsDetecting(true);
    setError(null);
    
    try {
      await verifoneService.requestBluetoothDevices();
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        setError(`Error al solicitar dispositivos Bluetooth: ${err.message}`);
      }
      setIsDetecting(false);
    }
  }, []);
  
  // Función para agregar dispositivo de red
  const addNetworkDevice = useCallback(() => {
    const { ipAddress, port, deviceType } = networkConfig;
    
    // Validar IP y puerto
    if (!ipAddress || !port) {
      message.error('Debe ingresar dirección IP y puerto');
      return;
    }
    
    // Crear identificador único
    const deviceId = `network-${ipAddress}-${port}`;
    
    // Verificar si ya existe
    const existingDevice = devices.find(d => d.id === deviceId);
    if (existingDevice) {
      message.warning('Este dispositivo ya ha sido agregado');
      return;
    }
    
    // Crear nuevo dispositivo
    const newDevice = {
      id: deviceId,
      name: `Terminal ${deviceType} (${ipAddress}:${port})`,
      model: deviceType,
      type: CONNECTION_TYPES.NETWORK,
      deviceType: deviceType,
      connected: false,
      ip: ipAddress,
      port: port
    };
    
    // Agregar a la lista
    const updatedDevices = [...devices, newDevice];
    setDevices(updatedDevices);
    
    // Limpiar formulario
    setNetworkConfig({
      ipAddress: '',
      port: '5000',
      deviceType: DEVICE_TYPES.P400
    });
    
    message.success('Dispositivo de red agregado correctamente');
  }, [devices, networkConfig]);
  
  // Función para conectar dispositivo
  const connectDevice = useCallback(async (deviceId) => {
    setError(null);
    
    try {
      // Si ya hay un dispositivo conectado, desconectarlo primero
      if (isConnected) {
        await verifoneService.disconnectDevice();
        setIsConnected(false);
      }
      
      // Conectar con el nuevo dispositivo
      const device = await verifoneService.connectToDevice(deviceId);
      setSelectedDevice(device);
    } catch (err) {
      setError(`Error al conectar con el dispositivo: ${err.message}`);
    }
  }, [isConnected]);
  
  // Función para desconectar dispositivo
  const disconnectDevice = useCallback(async () => {
    setError(null);
    
    try {
      await verifoneService.disconnectDevice();
      setIsConnected(false);
      setSelectedDevice(null);
    } catch (err) {
      setError(`Error al desconectar el dispositivo: ${err.message}`);
    }
  }, []);
  
  // Función para procesar el pago
  const handlePayment = async () => {
    setError(null);
    setTransaction(null);
    
    try {
      if (!selectedDevice || !isConnected) {
        throw new Error('No hay dispositivo conectado');
      }
      
      // Validar monto
      const parsedAmount = parseFloat(amountInput);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('El monto debe ser mayor a cero');
      }
      
      // Procesar pago
      await verifoneService.processPayment({
        amount: parsedAmount,
        reference: reference
      });
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Función para cancelar el pago
  const handleCancel = async () => {
    try {
      await verifoneService.cancelTransaction();
      
      // Notificar cancelación
      if (onCancel) {
        onCancel();
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Función para abrir modal de dispositivos
  const openDeviceModal = () => {
    findDevices();
    setShowDeviceModal(true);
  };
  
  // Función para cerrar modal de dispositivos
  const closeDeviceModal = () => {
    setShowDeviceModal(false);
  };
  
  // Renderizar controles principales
  const renderControls = () => {
    // Si hay un error, mostrar alerta
    if (error) {
      return (
        <Alert
          message="Error en el terminal"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
          action={
            <Button 
              type="primary" 
              danger 
              onClick={() => setError(null)}
            >
              Cerrar
            </Button>
          }
        />
      );
    }
    
    // Si hay una transacción completada, mostrar resultado
    if (status === TRANSACTION_STATUS.COMPLETED && transaction) {
      return renderTransactionDetails();
    }
    
    // Mostrar controles principales
    return (
      <>
        <Form layout="vertical">
          <Form.Item label="Monto a cobrar">
            <Input
              prefix={<DollarOutlined />}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="Ingrese el monto"
              disabled={isProcessing}
              type="number"
              step="0.01"
              min="0.01"
              addonAfter="MXN"
            />
          </Form.Item>
          
          <Form.Item label="Terminal de pago">
            {selectedDevice ? (
              <Input
                value={selectedDevice.name}
                disabled
                addonAfter={
                  <Button 
                    type="link" 
                    onClick={openDeviceModal}
                    disabled={isProcessing}
                    icon={<SettingOutlined />}
                  >
                    Cambiar
                  </Button>
                }
                prefix={getDeviceTypeIcon(selectedDevice.deviceType, selectedDevice.type)}
              />
            ) : (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={openDeviceModal}
                disabled={isProcessing}
                block
              >
                Seleccionar dispositivo
              </Button>
            )}
          </Form.Item>
          
          <Form.Item>
            <Row gutter={8}>
              <Col span={24}>
                <Button
                  type="primary"
                  icon={<CreditCardOutlined />}
                  onClick={handlePayment}
                  disabled={!isConnected || isProcessing || !selectedDevice}
                  loading={isProcessing}
                  block
                  size="large"
                >
                  {isProcessing ? getStatusText() : 'Procesar pago'}
                </Button>
              </Col>
            </Row>
          </Form.Item>
          
          {isProcessing && (
            <Form.Item>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleCancel}
                block
              >
                Cancelar transacción
              </Button>
            </Form.Item>
          )}
        </Form>
        
        {renderStatusMessage()}
      </>
    );
  };
  
  // Obtener texto según estado de transacción
  const getStatusText = () => {
    switch (status) {
      case TRANSACTION_STATUS.WAITING_CARD:
        return 'Esperando tarjeta...';
      case TRANSACTION_STATUS.CARD_READ:
        return 'Leyendo tarjeta...';
      case TRANSACTION_STATUS.AUTHORIZING:
        return 'Autorizando...';
      case TRANSACTION_STATUS.PROCESSING:
        return 'Procesando...';
      default:
        return 'Procesando...';
    }
  };
  
  // Obtener color según estado
  const getStatusColor = () => {
    switch (status) {
      case TRANSACTION_STATUS.READY:
        return 'blue';
      case TRANSACTION_STATUS.DEVICE_DETECTION:
      case TRANSACTION_STATUS.CONNECTING:
        return 'orange';
      case TRANSACTION_STATUS.CONNECTED:
        return 'green';
      case TRANSACTION_STATUS.PROCESSING:
      case TRANSACTION_STATUS.WAITING_CARD:
      case TRANSACTION_STATUS.CARD_READ:
      case TRANSACTION_STATUS.AUTHORIZING:
        return 'cyan';
      case TRANSACTION_STATUS.COMPLETED:
        return 'green';
      case TRANSACTION_STATUS.CANCELLED:
        return 'orange';
      case TRANSACTION_STATUS.ERROR:
        return 'red';
      default:
        return 'default';
    }
  };
  
  // Obtener icono según tipo de dispositivo
  const getDeviceTypeIcon = (deviceType, connectionType) => {
    if (connectionType === CONNECTION_TYPES.SIMULATION) {
      return <RobotOutlined style={{ color: '#722ed1' }} />;
    }
    
    if (connectionType === CONNECTION_TYPES.USB) {
      return <UsbOutlined style={{ color: '#1890ff' }} />;
    }
    
    if (connectionType === CONNECTION_TYPES.BLUETOOTH) {
      return <BluetoothOutlined style={{ color: '#1890ff' }} />;
    }
    
    if (connectionType === CONNECTION_TYPES.NETWORK) {
      return <WifiOutlined style={{ color: '#1890ff' }} />;
    }
    
    return <CreditCardOutlined style={{ color: '#1890ff' }} />;
  };
  
  // Renderizar mensaje de estado
  const renderStatusMessage = () => {
    // Si está en progreso, mostrar spinner y estado
    if (isProcessing) {
      return (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12 }}>
            <Badge 
              status={getStatusColor()} 
              text={<Text style={{ fontSize: 16 }}>{getStatusText()}</Text>} 
            />
          </div>
        </div>
      );
    }
    
    // Si está conectado y no está en progreso, mostrar estado
    if (isConnected && selectedDevice) {
      return (
        <Alert
          message={
            <Space>
              <Badge status={getStatusColor()} />
              <Text strong>Terminal listo para procesar pagos</Text>
            </Space>
          }
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                <Text strong>Dispositivo:</Text> {selectedDevice.name}
              </Text>
              <Text>
                <Text strong>Tipo:</Text> {selectedDevice.deviceType}
              </Text>
              <Button 
                type="text" 
                danger 
                icon={<DisconnectOutlined />}
                onClick={disconnectDevice}
                size="small"
              >
                Desconectar
              </Button>
            </Space>
          }
          type="info"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginTop: 16 }}
        />
      );
    }
    
    // Si no está conectado, mostrar mensaje para conectar
    if (selectedDevice && !isConnected) {
      return (
        <Alert
          message="Terminal no conectado"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                Se ha seleccionado {selectedDevice.name} pero no está conectado
              </Text>
              <Button 
                type="primary" 
                size="small"
                icon={<LinkOutlined />}
                onClick={() => connectDevice(selectedDevice.id)}
              >
                Conectar dispositivo
              </Button>
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      );
    }
    
    // Si no hay dispositivo seleccionado
    if (!selectedDevice) {
      return (
        <Alert
          message="No hay terminal seleccionado"
          description="Seleccione un terminal para procesar pagos"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          action={
            <Button 
              type="primary" 
              size="small"
              onClick={openDeviceModal}
            >
              Seleccionar
            </Button>
          }
        />
      );
    }
    
    return null;
  };
  
  // Renderizar contenido del modal de dispositivos
  const renderDeviceModalContent = () => {
    return (
      <Tabs 
        activeKey={activeTab} 
        onChange={tab => setActiveTab(tab)}
        style={{ marginTop: -16 }}
      >
        <TabPane 
          tab={
            <span>
              <AppstoreOutlined />
              Dispositivos detectados
            </span>
          } 
          key="devices"
        >
          {/* Controles de búsqueda */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Space wrap>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={findDevices}
                  loading={isDetecting}
                >
                  Buscar dispositivos
                </Button>
                
                {browserSupportInfo.usb && (
                  <Button
                    icon={<UsbOutlined />}
                    onClick={requestUsbDevices}
                    loading={isDetecting}
                  >
                    Solicitar USB
                  </Button>
                )}
                
                {browserSupportInfo.bluetooth && (
                  <Button
                    icon={<BluetoothOutlined />}
                    onClick={requestBluetoothDevices}
                    loading={isDetecting}
                  >
                    Solicitar Bluetooth
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
          
          {/* Lista de dispositivos */}
          {isDetecting ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin tip="Buscando dispositivos..." />
            </div>
          ) : (
            <>
              {devices.length === 0 ? (
                <Empty 
                  description="No se encontraron dispositivos" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  dataSource={devices}
                  renderItem={device => (
                    <List.Item
                      actions={[
                        device.connected ? (
                          <Button
                            danger
                            size="small"
                            icon={<DisconnectOutlined />}
                            onClick={() => disconnectDevice()}
                          >
                            Desconectar
                          </Button>
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            icon={<LinkOutlined />}
                            onClick={() => connectDevice(device.id)}
                          >
                            Conectar
                          </Button>
                        ),
                        <Button
                          type="text"
                          size="small"
                          icon={<SettingOutlined />}
                          onClick={() => setSelectedDevice(device)}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge
                            count={device.connected ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 0}
                            offset={[-5, 5]}
                          >
                            <div style={{ 
                              fontSize: 24, 
                              width: 40, 
                              height: 40, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: '#f5f5f5',
                              borderRadius: '50%'
                            }}>
                              {getDeviceTypeIcon(device.deviceType, device.type)}
                            </div>
                          </Badge>
                        }
                        title={
                          <Space>
                            {device.name}
                            {device.connected && (
                              <Tag color="green">Conectado</Tag>
                            )}
                          </Space>
                        }
                        description={
                          <>
                            <div>
                              Tipo: {device.deviceType}
                              {' '}
                              <Tag color="blue">
                                {device.type === CONNECTION_TYPES.USB ? 'USB' : 
                                 device.type === CONNECTION_TYPES.BLUETOOTH ? 'Bluetooth' :
                                 device.type === CONNECTION_TYPES.NETWORK ? 'Red' : 'Simulación'}
                              </Tag>
                            </div>
                            {device.type === CONNECTION_TYPES.NETWORK && (
                              <div>IP: {device.ip}:{device.port}</div>
                            )}
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </>
          )}
          
          {/* Información de soporte */}
          <Divider />
          <Alert
            type="info"
            message="Información del navegador"
            description={
              <Space direction="vertical">
                <Text>
                  Soporte USB: {browserSupportInfo.usb ? 
                    <Tag color="green">Soportado</Tag> : 
                    <Tag color="red">No soportado</Tag>}
                </Text>
                <Text>
                  Soporte Bluetooth: {browserSupportInfo.bluetooth ? 
                    <Tag color="green">Soportado</Tag> : 
                    <Tag color="red">No soportado</Tag>}
                </Text>
                <Text type="secondary">
                  Las APIs Web USB y Web Bluetooth requieren navegadores modernos y solo funcionan en HTTPS.
                </Text>
              </Space>
            }
            showIcon
          />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <GlobalOutlined />
              Agregar dispositivo
            </span>
          } 
          key="add"
        >
          <Tabs defaultActiveKey="network">
            <TabPane 
              tab={
                <span>
                  <WifiOutlined />
                  Dispositivo de red
                </span>
              } 
              key="network"
            >
              <Form layout="vertical">
                <Form.Item 
                  label="Dirección IP" 
                  required
                  extra="Dirección IP del terminal Verifone"
                >
                  <Input 
                    prefix={<HomeOutlined />}
                    placeholder="192.168.1.100" 
                    value={networkConfig.ipAddress}
                    onChange={e => setNetworkConfig({
                      ...networkConfig,
                      ipAddress: e.target.value
                    })}
                  />
                </Form.Item>
                
                <Form.Item 
                  label="Puerto" 
                  required
                  extra="Puerto de comunicación (por defecto: 5000)"
                >
                  <Input 
                    prefix={<ApiOutlined />}
                    placeholder="5000" 
                    value={networkConfig.port}
                    onChange={e => setNetworkConfig({
                      ...networkConfig,
                      port: e.target.value
                    })}
                  />
                </Form.Item>
                
                <Form.Item 
                  label="Modelo" 
                  required
                >
                  <Select
                    value={networkConfig.deviceType}
                    onChange={value => setNetworkConfig({
                      ...networkConfig,
                      deviceType: value
                    })}
                  >
                    <Option value={DEVICE_TYPES.P400}>Verifone P400</Option>
                    <Option value={DEVICE_TYPES.CARBON}>Verifone Carbon</Option>
                    <Option value={DEVICE_TYPES.VX520}>Verifone VX520</Option>
                    <Option value={DEVICE_TYPES.M400}>Verifone M400</Option>
                    <Option value={DEVICE_TYPES.E355}>Verifone E355</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={addNetworkDevice}
                    block
                  >
                    Agregar dispositivo
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <InfoCircleOutlined />
                  Instrucciones
                </span>
              } 
              key="instructions"
            >
              <Card bordered={false}>
                <Title level={4}>Cómo conectar su terminal Verifone</Title>
                
                <Divider>Conexión USB</Divider>
                <Paragraph>
                  1. Conecte el cable USB del terminal a su computadora
                </Paragraph>
                <Paragraph>
                  2. Haga clic en "Solicitar USB" y seleccione su dispositivo
                </Paragraph>
                <Paragraph>
                  3. Seleccione el dispositivo de la lista y haga clic en "Conectar"
                </Paragraph>
                
                <Divider>Conexión Bluetooth</Divider>
                <Paragraph>
                  1. Active el Bluetooth en su terminal Verifone
                </Paragraph>
                <Paragraph>
                  2. Haga clic en "Solicitar Bluetooth" y seleccione su dispositivo
                </Paragraph>
                <Paragraph>
                  3. Complete el emparejamiento si se solicita
                </Paragraph>
                
                <Divider>Conexión de red</Divider>
                <Paragraph>
                  1. Configure su terminal Verifone para usar una dirección IP fija
                </Paragraph>
                <Paragraph>
                  2. Ingrese la dirección IP y puerto en la pestaña "Dispositivo de red"
                </Paragraph>
                <Paragraph>
                  3. Haga clic en "Agregar dispositivo" y luego en "Conectar"
                </Paragraph>
                
                <Alert
                  message="Nota importante"
                  description="Las conexiones USB y Bluetooth solo están disponibles en navegadores modernos y requieren HTTPS. Si tiene problemas, utilice el simulador para pruebas."
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </Card>
            </TabPane>
          </Tabs>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <RobotOutlined />
              Simulador
            </span>
          } 
          key="simulator"
        >
          <Result
            icon={<RobotOutlined style={{ color: '#722ed1' }} />}
            title="Simulación de terminal Verifone"
            subTitle="Utilice esta opción para hacer pruebas sin hardware físico"
            extra={
              <Button 
                type="primary" 
                icon={<LinkOutlined />}
                onClick={() => {
                  // Buscar el dispositivo simulado
                  const simulatedDevice = devices.find(d => 
                    d.type === CONNECTION_TYPES.SIMULATION
                  );
                  
                  if (simulatedDevice) {
                    connectDevice(simulatedDevice.id);
                  } else {
                    message.error('No se encontró dispositivo simulado');
                  }
                }}
              >
                Conectar simulador
              </Button>
            }
          />
          
          <Alert
            message="Información"
            description="El simulador imita el comportamiento de un terminal físico, permitiendo completar transacciones de prueba sin hardware real."
            type="info"
            showIcon
          />
        </TabPane>
      </Tabs>
    );
  };
  
  // Renderizar detalles de transacción
  const renderTransactionDetails = () => {
    if (!transaction) return null;
    
    return (
      <Result
        status="success"
        title="¡Pago completado!"
        subTitle={
          <Text>
            Autorización: <Text strong>{transaction.authCode}</Text>
          </Text>
        }
        extra={[
          <Button 
            type="primary" 
            key="done" 
            onClick={() => {
              setTransaction(null);
              setStatus(TRANSACTION_STATUS.READY);
            }}
          >
            Aceptar
          </Button>
        ]}
      >
        <div className="desc">
          <Card>
            <Descriptions column={1}>
              <Descriptions.Item label="Monto">
                <Text strong>${parseFloat(transaction.amount).toFixed(2)} MXN</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tarjeta">
                <Space>
                  {transaction.cardType}
                  <Tag color="blue">••••{transaction.last4}</Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Transacción">
                {transaction.transactionId}
              </Descriptions.Item>
              <Descriptions.Item label="Terminal">
                {selectedDevice?.name || 'Terminal'}
              </Descriptions.Item>
              {transaction.reference && (
                <Descriptions.Item label="Referencia">
                  {transaction.reference}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Fecha">
                {new Date().toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </Result>
    );
  };
  
  return (
    <div className="verifone-terminal">
      <Card
        title={
          <Space>
            <CreditCardOutlined />
            <span>Terminal de Pago Verifone</span>
            <Badge 
              status={getStatusColor()} 
              text={status} 
            />
          </Space>
        }
        extra={
          <Button 
            type="link" 
            onClick={openDeviceModal}
            icon={<SettingOutlined />}
            disabled={isProcessing}
          >
            Configurar
          </Button>
        }
        style={{ width: '100%' }}
      >
        {renderControls()}
        
        {/* Mostrar progreso de conexión si está en proceso */}
        {showConnectionStatus && (
          <div style={{ marginTop: 16 }}>
            <Progress 
              percent={connectionProgress} 
              status={connectionProgress === 100 ? "success" : "active"}
              format={() => connectionProgressText}
            />
          </div>
        )}
      </Card>
      
      <Modal
        title="Seleccionar dispositivo"
        open={showDeviceModal}
        onCancel={closeDeviceModal}
        footer={null}
        width={700}
      >
        {renderDeviceModalContent()}
      </Modal>
    </div>
  );
};

export default VerifoneTerminal; 