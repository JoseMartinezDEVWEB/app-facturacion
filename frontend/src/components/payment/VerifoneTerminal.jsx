import React, { useState, useEffect } from "react";
import { Card, Button, Steps, Result, Row, Col, Typography, Spin } from "antd";
import { SwapOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from "@ant-design/icons";

const { Step } = Steps;
const { Title, Text } = Typography;

/**
 * Componente para integrar y manejar el terminal Verifone
 */
const VerifoneTerminal = ({ amount, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [transactionResult, setTransactionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simula la conexión con el terminal
  useEffect(() => {
    if (currentStep === 1) {
      setLoading(true);
      // Simulación de conexión al terminal
      const timeout = setTimeout(() => {
        setLoading(false);
        setCurrentStep(2);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [currentStep]);
  
  // Simulación de procesamiento de pago
  useEffect(() => {
    if (currentStep === 3) {
      setLoading(true);
      // Simulación de procesamiento del pago
      const timeout = setTimeout(() => {
        setLoading(false);
        // Simulamos una transacción exitosa con 90% de probabilidad
        const isSuccessful = Math.random() < 0.9;
        
        if (isSuccessful) {
          setTransactionResult({
            success: true,
            referenceId: "VRF" + Math.floor(Math.random() * 1000000).toString().padStart(6, "0"),
            cardBrand: ["VISA", "MASTERCARD", "AMEX"][Math.floor(Math.random() * 3)],
            last4: Math.floor(Math.random() * 10000).toString().padStart(4, "0")
          });
        } else {
          setError("Transacción rechazada por el banco emisor");
          setTransactionResult({ success: false });
        }
        
        setCurrentStep(4);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [currentStep]);

  const startTransaction = () => {
    setCurrentStep(1);
  };
  
  const processPayment = () => {
    setCurrentStep(3);
  };
  
  const handleComplete = () => {
    if (onComplete && transactionResult) {
      onComplete(transactionResult);
    }
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card bordered={false}>
            <Result
              icon={<SwapOutlined />}
              title="Terminal Verifone"
              subTitle={`Monto a cobrar: $${amount?.toFixed(2) || "0.00"}`}
              extra={
                <Button type="primary" size="large" onClick={startTransaction}>
                  Conectar Terminal
                </Button>
              }
            />
          </Card>
        );
      
      case 1:
      case 2:
        return (
          <Card bordered={false}>
            {loading ? (
              <Result
                icon={<Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />}
                title="Conectando con el terminal"
                subTitle="Por favor espere mientras establecemos conexión..."
              />
            ) : (
              <Result
                status="success"
                title="Terminal conectado"
                subTitle="El terminal está listo para procesar el pago"
                extra={
                  <Button type="primary" size="large" onClick={processPayment}>
                    Procesar Pago
                  </Button>
                }
              />
            )}
          </Card>
        );
      
      case 3:
        return (
          <Card bordered={false}>
            <Result
              icon={<Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />}
              title="Procesando pago"
              subTitle="Por favor inserte, deslice o acerque la tarjeta al terminal"
            />
          </Card>
        );
      
      case 4:
        return (
          <Card bordered={false}>
            {transactionResult?.success ? (
              <Result
                status="success"
                title="¡Pago Completado!"
                subTitle={`Referencia: ${transactionResult.referenceId}`}
                extra={[
                  <Button type="primary" key="complete" onClick={handleComplete}>
                    Finalizar
                  </Button>
                ]}
              >
                <Row gutter={[0, 16]}>
                  <Col span={24}>
                    <Text strong>Tarjeta:</Text> {transactionResult.cardBrand} terminada en {transactionResult.last4}
                  </Col>
                  <Col span={24}>
                    <Text strong>Monto:</Text> ${amount?.toFixed(2) || "0.00"}
                  </Col>
                </Row>
              </Result>
            ) : (
              <Result
                status="error"
                title="Error en el pago"
                subTitle={error || "No se pudo completar la transacción"}
                extra={[
                  <Button type="primary" key="retry" onClick={() => setCurrentStep(0)}>
                    Reintentar
                  </Button>,
                  <Button key="cancel" onClick={handleCancel}>
                    Cancelar
                  </Button>
                ]}
              />
            )}
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <Title level={4} style={{ textAlign: "center", marginBottom: "24px" }}>
        Pago con Terminal
      </Title>
      
      <Steps current={currentStep} style={{ marginBottom: "24px" }}>
        <Step title="Inicio" description="Conectar terminal" />
        <Step title="Conexión" description="Terminal listo" />
        <Step title="Pago" description="Procesar pago" />
        <Step title="Resultado" description="Finalizar" />
      </Steps>
      
      {renderStepContent()}
    </div>
  );
};

export default VerifoneTerminal; 