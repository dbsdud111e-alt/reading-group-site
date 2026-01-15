import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const TTB_KEY = 'ttbyoun11e2226001';

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    try {
        const aladdinUrl = `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${TTB_KEY}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101`;

        console.log(`Fetching from Aladdin: ${aladdinUrl}`);

        const response = await fetch(aladdinUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Aladdin API responded with ${response.status}: ${errorText}`);
            throw new Error(`Aladdin API error: ${response.status}`);
        }

        const text = await response.text();
        // output=js returns JSON followed by a semicolon (;). We need to trim it.
        const jsonString = text.trim().replace(/;$/, '');

        let data;
        try {
            data = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('Failed to parse Aladdin JSON:', text);
            throw new Error('Aladdin API returned invalid JSON');
        }

        if (data.errorCode) {
            console.error('Aladdin API error code:', data.errorCode, data.errorMessage);
            return NextResponse.json({ error: data.errorMessage }, { status: 400 });
        }

        const books = data.item?.map((item: any) => ({
            title: item.title,
            author: item.author,
            publisher: item.publisher,
            cover_url: item.cover,
            isbn: item.isbn,
            description: item.description,
            toc: "",
        })) || [];

        return NextResponse.json(books);
    } catch (error: any) {
        console.error('API route error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
