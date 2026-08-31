import { LegalRiskItem, EthicsQuestion } from "../types";

export const legalRisks: LegalRiskItem[] = [
  {
    id: "risk-tos",
    title: "Infração dos Termos de Serviço (ToS) do YouTube",
    category: "YouTube ToS",
    riskLevel: "Critical",
    legalReference: "ToS do YouTube (Seção 5.B - Permissões & Restrições)",
    impactDescription: "Proíbe especificamente baixar, copiar, distribuir, transmitir, exibir ou vender qualquer parte do Serviço, a menos que explicitamente autorizado ou pré-acordado. O YouTube reserva-se o direito de encerrar contas, bloquear sub-redes de IP ou emitir mandados de cessação e desistência para domínios da web que hospedem tais aplicativos de download.",
    mitigationStrategy: "Não automatize a coleta, raspagem ou extração direta de fluxos de vídeo a partir de URLs ao vivo do YouTube em seu servidor. Posicione seu aplicativo estritamente como um processador local e offline de gravações de tela. Isso desvincula seu servidor do loop de extração de dados, transferindo a responsabilidade para o fluxo de captura de tela local do próprio cliente."
  },
  {
    id: "risk-copyright",
    title: "Violação Direta de Direitos Autorais",
    category: "Copyright Law",
    riskLevel: "High",
    legalReference: "Lei de Direitos Autorais (Art. 29 da Lei nº 9.610/98 no Brasil)",
    impactDescription: "O titular dos direitos autorais de uma obra musical detém os direitos exclusivos de reproduzir, distribuir e executar a obra. Criar uma cópia MP3 permanente de uma trilha de áudio protegida sem autorização do editor ou gravadora constitui violação direta de direitos autorais.",
    mitigationStrategy: "Restrinja explicitamente o escopo do aplicativo para gravações geradas pelo próprio usuário, trilhas sonoras licenciadas livres de royalties ou materiais em domínio público. Inclua avisos destacados e não dispensáveis na interface do usuário alertando os usuários contra a conversão de mídias comerciais protegidas."
  },
  {
    id: "risk-fair-use",
    title: "Má Interpretação de Uso Justo (Fair Use) / Limitações",
    category: "Fair Use",
    riskLevel: "Medium",
    legalReference: "Lei de Direitos Autorais (Art. 46 da Lei nº 9.610/98 - Exceções no Brasil)",
    impactDescription: "Muitos usuários presumem incorretamente que todo 'uso pessoal' ou 'uso educacional' se enquadra nas exceções legais. Converter uma música completa e não modificada em um MP3 substitui diretamente o valor comercial de mercado de comprar a música ou transmit-la legalmente via streaming. Tribunais raramente reconhecem conversões de formato completo de músicas comerciais como uso transformador.",
    mitigationStrategy: "Forneça diretrizes interativas explicando as exceções legais brasileiras e os fatores do Fair Use. Incentive os usuários a converter apenas trechos curtos, análises educacionais ou remixes altamente transformadores."
  },
  {
    id: "risk-dmca",
    title: "Riscos da Isenção Safe Harbor e DMCA",
    category: "DMCA",
    riskLevel: "Critical",
    legalReference: "Digital Millennium Copyright Act (17 U.S.C. § 512) & Marco Civil da Internet (Lei nº 12.965/14)",
    impactDescription: "Se a sua plataforma hospeda ou coordena a distribuição de arquivos MP3 convertidos, você perde a imunidade de Safe Harbor (provedor intermediário) e se torna solidariamente responsável. Além disso, a lei proíbe criar ferramentas que burlem medidas tecnológicas de proteção contra cópias (DRM ou assinaturas cifradas de plataformas).",
    mitigationStrategy: "Adote um modelo rígido de execução exclusiva do lado do cliente (no próprio navegador). Nunca armazene, armazene em cache ou hospede arquivos de mídia convertidos no seu servidor. Não integre algoritmos de download direto que quebrem criptografias."
  }
];

export const ethicsQuestions: EthicsQuestion[] = [
  {
    id: "question-ownership",
    question: "Você possui os direitos sobre o conteúdo sendo convertido?",
    description: "Você é o criador original ou possui autorização por escrito do detentor legal dos direitos autorais?",
    weight: 25
  },
  {
    id: "question-purpose",
    question: "Seu uso é estritamente educacional, científico ou altamente transformador?",
    description: "Você está usando o áudio para fins de crítica, comentários acadêmicos, pesquisa científica ou paródias altamente transformadas, em vez de uma cópia direta?",
    weight: 20
  },
  {
    id: "question-distribution",
    question: "O arquivo final permanecerá totalmente offline e para fins de arquivo pessoal?",
    description: "Você se compromete a nunca compartilhar, distribuir, hospedar ou vender o arquivo MP3 resultante?",
    weight: 25
  },
  {
    id: "question-market",
    question: "Esta conversão evita substituir a reprodução comercial ou as vendas do artista original?",
    description: "A sua conversão evita funcionar como um substituto para a compra da faixa ou para sua reprodução em plataformas oficiais com anúncios/assinaturas?",
    weight: 30
  }
];

export const ethicsRatingDescriptions = {
  aligned: {
    title: "Alinhamento Ético Ideal (Pontuação 80–100%)",
    description: "Seu uso pretendido está perfeitamente alinhado com as principais diretrizes de direitos autorais e exceções de uso justo (ex: arquivo pessoal de transmissões licenciadas, análise educacional ou conteúdo de propriedade própria). O risco legal é extremamente minimizado.",
    color: "text-emerald-400 bg-emerald-950/20 border-emerald-500/20"
  },
  moderate: {
    title: "Risco Moderado (Pontuação 50–79%)",
    description: "Seu uso apresenta indicadores mistos. Embora possa ser não comercial, a reprodução de faixas completas de músicas protegidas sem a propriedade das mesmas ainda viola termos de serviço de plataformas e diminui visualizações oficiais. Prossiga com muita cautela.",
    color: "text-amber-400 bg-amber-950/20 border-amber-500/20"
  },
  highRisk: {
    title: "Alto Risco Ético/Jurídico (Pontuação <50%)",
    description: "Seu uso pretendido constitui violação direta de direitos autorais e dos termos de serviço das plataformas. Reproduzir e distribuir obras protegidas prejudica a receita do artista e traz altos riscos de notificações de remoção por direitos autorais, suspensão de contas ou penalidades legais.",
    color: "text-red-400 bg-red-950/20 border-red-500/20"
  }
};
