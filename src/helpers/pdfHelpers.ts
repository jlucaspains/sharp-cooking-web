import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Recipe } from '../services/recipe';

export interface PDFGenerationOptions {
  title: string;
  coverDate?: string;
}

/**
 * Generate cover page for recipe book PDF
 */
export function generateCoverPage(doc: jsPDF, title: string, date?: string): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Title
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(title, pageWidth - 40);
  const titleHeight = titleLines.length * 12;
  doc.text(titleLines, pageWidth / 2, pageHeight / 2 - titleHeight / 2, { align: 'center' });
  
  // Date
  if (date) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(date, pageWidth / 2, pageHeight - 30, { align: 'center' });
  }
}

/**
 * Generate table of contents for recipe book PDF
 */
export function generateTableOfContents(doc: jsPDF, recipes: Recipe[]): void {
  doc.addPage();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', pageWidth / 2, 20, { align: 'center' });
  
  // Recipe list
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const tocData = recipes.map((recipe, index) => [
    `${index + 1}. ${recipe.title}`,
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [],
    body: tocData,
    theme: 'plain',
    styles: { fontSize: 12, cellPadding: 3 },
    margin: { left: 20, right: 20 },
  });
}

/**
 * Compress and resize image to max width of 800px
 */
export async function compressImage(imageData: string, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedData = canvas.toDataURL('image/jpeg', 0.8);
      resolve(compressedData);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageData;
  });
}

/**
 * Generate a recipe page in the PDF
 */
export async function generateRecipePage(
  doc: jsPDF,
  recipe: Recipe,
  recipeImage: string | null,
  isFirstRecipe: boolean = false
): Promise<void> {
  if (!isFirstRecipe) {
    doc.addPage();
  }
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;
  
  // Recipe Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(recipe.title, pageWidth - 40);
  doc.text(titleLines, 20, yPosition);
  yPosition += titleLines.length * 8 + 10;
  
  // Recipe Image (if available)
  if (recipeImage) {
    try {
      const compressedImage = await compressImage(recipeImage, 800);
      const imgProps = doc.getImageProperties(compressedImage);
      const imgWidth = Math.min(pageWidth - 40, 150);
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      doc.addImage(compressedImage, 'JPEG', 20, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.warn('Failed to add image to PDF:', error);
    }
  }
  
  // Ingredients Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ingredients', 20, yPosition);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  recipe.ingredients.forEach((ingredient) => {
    const ingredientLines = doc.splitTextToSize(`• ${ingredient}`, pageWidth - 40);
    ingredientLines.forEach((line: string) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
  });
  
  yPosition += 5;
  
  // Steps Section
  if (yPosition > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Steps', 20, yPosition);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  recipe.steps.forEach((step, index) => {
    const stepText = `${index + 1}. ${step}`;
    const stepLines = doc.splitTextToSize(stepText, pageWidth - 40);
    stepLines.forEach((line: string) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
    yPosition += 3;
  });
}

/**
 * Initialize a new PDF document
 */
export function initializePDF(): jsPDF {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
}
